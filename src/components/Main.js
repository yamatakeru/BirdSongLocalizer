import React, { useState, useEffect, createContext, useContext } from 'react'
import Konva from 'konva';
import useImage from 'use-image';
import { Stage, Layer, Star, Rect, Text, Image } from 'react-konva';
import request from "superagent";
import { UserCount } from '../App';
import Reset from './Reset';


const URLImage = (props) => {
  const [image] = useImage(props.url);
  return <Image
    image={image}
    x={props.x}
    y={props.y}
    scaleX={props.scaleX}
    scaleY={props.scaleY}
    draggable={props.draggable}
    dragBoundFunc={props.dragBoundFunc}
  />;
};


const Main = () => {
  const [count, setCount] = useContext(UserCount);
  const [img_data, setImgData] = useState(null);
  const [localized_data, setLocalizedData] = useState([]);
  const [data_ia_loaded, setDataIsLoaded] = useState(false);
  const [ldata_ia_loaded, setLDataIsLoaded] = useState(false);
  const [ldata_is_selected, setLDataIsSelected] = useState(-1);
  const [zoom_rate, setZoomRate] = useState(1.0);
  const [img_pos_x, setImgPosX] = useState(10.0)

  const getSpectrumImg = () => {
    request
      .get("/api/getSpectrumImg")
      .end((err, data) => {
        if (err) {
          console.error(err);
          return;
        }
          setImgData(data.body);
          setDataIsLoaded(true);
          return;
      });
  };

  const getLocalizedData = () => {
    request
      .get("/api/getLocalizedData")
      .end((err, data) => {
        if (err) {
          console.error(err);
          return;
        }
          setLocalizedData(data.body.localized_data);
          setLDataIsLoaded(true);
          return;
      });
  };

  const sendAnnotationData = () => {
    request
    .post("/api/sendAnnotationData")
    .send(localized_data)
    .end((err, res) => {
      if (err) {
        console.error(err);
        return;
      }
        console.log(res.body.res);
        return;
    });
  };

  const updateLocalizedPos = (e) => {
    const temp = localized_data.slice(0);
    const idx = ldata_is_selected + 1;
    
    temp[idx][2] = String(((e.target.x() - img_pos_x) * (img_data.music.t_max / 992)) / zoom_rate);
    temp[idx][4] = String((-((e.target.y() + 10-20) / (740 / 2))) * 360 + 180);
    setLocalizedData(temp);
  };

  const zoomStage = (e) => {
    e.evt.preventDefault();
    const next_zoom_rate = zoom_rate + e.evt.deltaY * -0.001;
    if (next_zoom_rate < 1.0) {
      next_zoom_rate = 1.0;
    }
    setZoomRate(next_zoom_rate);
  };

  const moveXImage = (pos, type) => {
    const next_pos_x = pos.x; // pos.x < 10.0 ? 10.0 : pos.x;
    const next_pos_y = type === "music" ? 20.0: 0.0;

    setImgPosX(next_pos_x);
    return {"x": next_pos_x, "y": next_pos_y};
  };

  const playWav = (idx) => {
    // ローカルファイル再生不可能問題のため未実装
    console.log("play sep_" + String(idx) + ".vaw.");
  };

  const reset = () => {
    setDataIsLoaded(false);
    setLDataIsLoaded(false);
    setLDataIsSelected(-1); 
    setZoomRate(1.0);
    setImgPosX(10.0);

  };

  const button_area = () => {
    if (data_ia_loaded) {
      return (
        <div className="button_area">
          <button onClick={() => getSpectrumImg()}>
            Load Spectrum
          </button>
          <button onClick={() => getLocalizedData()}>
            Load Localized Sata
          </button>
          <button onClick={() => sendAnnotationData()}>
            Save Annotation Sata
          </button>
          <button onClick={() => reset()}>
            Resrt
          </button>
      </div>
      );
    } else {
      return (
        <div className="button_area">
          <button onClick={() => getSpectrumImg()}>
            load Spectrum
          </button>
        </div>
      );
    }
  }

  const stage_area = () => {
    if (data_ia_loaded) {
      return (
        <div className="stage_area">
          <div className="Stage1">
            <p>Specgram</p>
            <Stage width={window.innerWidth} height={740/2}>
              <Layer
                onWheel={e => zoomStage(e)}
              >
                <Rect
                  x={0.0}
                  y={0.0}
                  width={window.innerWidth}
                  height={740/2}
                  fill="LightGray"
                />
                <URLImage
                  //url="https://raw.githubusercontent.com/yamatakeru/image_src/master/specgram.png"
                  url={img_data.specgram.img_path}
                  x={img_pos_x}
                  y={0.0}
                  scaleX={zoom_rate}
                  scaleY={0.5}
                  draggable={true}
                  dragBoundFunc={(pos) => moveXImage(pos, "specgram")}
                />
              </Layer>
            </Stage>
          </div>
          <div className="Stage2">
          <p>Music</p>
          <Stage width={window.innerWidth} height={(740/2) + 40}>
            <Layer
              onWheel={e => zoomStage(e)}
            >
              <Rect
                  x={0.0}
                  y={0.0}
                  width={window.innerWidth}
                  height={(740/2) + 40}
                  fill="LightGray"
              />
              <URLImage
                //url="https://raw.githubusercontent.com/yamatakeru/image_src/master/music.png"
                url={img_data.music.img_path}
                x={img_pos_x}
                y={20}
                scaleX={zoom_rate}
                scaleY={0.5}
                draggable={true}
                dragBoundFunc={(pos) => moveXImage(pos, "music")}
              />
              {localized_data.slice(1).map(ld => {
                return (
                  <Rect
                    x={(((parseFloat(ld[2]) / img_data.music.t_max) * 992) * zoom_rate) + img_pos_x}
                    y={((-parseFloat(ld[4]) + 180) / 360) * (740 / 2) - 10 + 20}
                    draggable={true}
                    width={((parseFloat(ld[3]) / img_data.music.t_max) * 992) * zoom_rate}
                    height={20}
                    fill="red"
                    stroke='black'
                    strokeWidth={2}
                    opacity={0.6}
                    onClick={() => setLDataIsSelected(parseInt(ld[0]))}
                    onDragStart={() => setLDataIsSelected(parseInt(ld[0]))}
                    onDragEnd={e =>updateLocalizedPos(e)}
                    onDblClick={() => playWav(parseInt(ld[0]))}
                  />
                )})
              }
            </Layer>
          </Stage>
        </div>
      </div>
      );
    } else {
      return <p>Please load spectrum data.</p>;
    }
  };

  const localized_data_area = () => {
    if (ldata_ia_loaded && ldata_is_selected >= 0) {
      return (
        <dev className="localized_info">
          <p>Localized Information</p>
          {localized_data.slice(1)[ldata_is_selected].map(d => {
            return <ul>{d}</ul>
            })
          }
        </dev>
      );
    }
    return;
  };

  return (
    <div className="Main">
      {button_area()}
      {stage_area()}
      {localized_data_area()}
    </div>
  );
}

export default Main;
