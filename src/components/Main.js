import React, { useState, useEffect, createContext, useContext } from 'react'
import Konva from 'konva';
import useImage from 'use-image';
import { Stage, Layer, Star, Rect, Text, Image, Transformer } from 'react-konva';
import request from "superagent";
import { UserCount } from '../App';
import Reset from './Reset';
import useUndo from 'use-undo';


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


const LocalizedData = (props) => {
  const shapeRef = React.useRef();
  const trRef = React.useRef();

  React.useEffect(() => {
    if (props.isSelected) {
      // we need to attach transformer manually
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [props.isSelected]);

  return (
    <React.Fragment>
      <Rect
        x={props.x}
        y={props.y}
        width={props.width}
        height={props.height}
        fill={props.fill}
        stroke={props.stroke}
        strokeWidth={props.strokeWidth}
        opacity={props.opacity}
        onClick={props.onSelect}
        onTap={props.onSelect}
        ref={shapeRef}
        draggable={props.draggable}
        onDragEnd={(e) => {props.onChange(e.target.x(), e.target.y(), e.target.width(), e.target.height())}}
        onDblClick={props.onDblClick}
        onTransformEnd={(e) => {
          // transformer is changing scale of the node
          // and NOT its width or height
          // but in the store we have only width and height
          // to match the data better we will reset scale on transform end
          const node = shapeRef.current;
          const scaleX = node.scaleX();

          // we will reset it back
          node.scaleX(1);
          props.onChange(node.x(), node.y(), Math.max(5, node.width() * scaleX), node.height());
        }}
      />
      {props.isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (newBox.width < 5 || newBox.y !== oldBox.y || newBox.height !== oldBox.height) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
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
  const [current_img_num, setCurrentImgNum] = useState(0);
  const [relative, setRelative] = useState(false);

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
          console.log(data.body);
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

  const updateLocalizedInfo = (x, y, width, height) => {
    const temp = localized_data.slice(0);
    const idx = ldata_is_selected + 1;
    
    temp[idx][2] = String(relative ?
                            ((((x - img_pos_x) / zoom_rate)) * (img_data.music.t_max / 992)):
                            ((((x - img_pos_x) / zoom_rate) + current_img_num * img_data.music.dt_num) * (img_data.music.t_max / 992)));
    temp[idx][3] = String((width / zoom_rate) * (img_data.music.t_max / 992));
    temp[idx][4] = String((-((y + 10-20) / (740 / 2))) * 360 + 180);
    setLocalizedData(temp);
  };

  const zoomStage = (e) => {
    e.evt.preventDefault();
    var next_zoom_rate = zoom_rate + e.evt.deltaY * -0.001;
    if (next_zoom_rate < 1.0) {
      next_zoom_rate = 1.0;
    }
    setZoomRate(next_zoom_rate);
  };

  const changeZoomRate = (zr) => {
    
    setImgPosX(img_pos_x -  (((zr - zoom_rate) * img_data.specgram.t_max) / 2));
    setZoomRate(zr);
  };

  const moveXImage = (pos, type) => {
    const next_pos_x = pos.x; // pos.x < 10.0 ? 10.0 : pos.x;
    const next_pos_y = type === "music" ? 20.0: 0.0;

    setImgPosX(relative? next_pos_x - (current_img_num * img_data.music.dt_num) * zoom_rate: next_pos_x);
    return {"x": next_pos_x, "y": next_pos_y};
  };

  const changeImageArea = (next_img_num) => {
    setCurrentImgNum(next_img_num);
  };

  const playWav = (idx) => {
    const music = new Audio(img_data.sound_source_paths[idx]);
    music.play();
  };

  const deleteLocalizedData = () => {
    const temp = localized_data.slice(0);
    const idx = ldata_is_selected + 1;

    temp[idx][0] = -1;
    setLocalizedData(temp);
    setLDataIsSelected(-1);
  };

  const reset = () => {
    setDataIsLoaded(false);
    setLDataIsLoaded(false);
    setLDataIsSelected(-1); 
    setZoomRate(1.0);
    setImgPosX(10.0);
    setCurrentImgNum(0);
    setRelative(false);
  };

  const op_button_area = () => {
    if (data_ia_loaded) {
      return (
        <React.Fragment>
          <div className="op_button_area1">
            <button onClick={getSpectrumImg}>
              Load Spectrum
            </button>
            <button onClick={getLocalizedData}>
              Load Localized Sata
            </button>
            <button onClick={sendAnnotationData}>
              Save Annotation Sata
            </button>
            <button onClick={reset}>
              Resrt
            </button>
        </div>
        <div className="op_button_area2">
          <button onClick={() => changeZoomRate(1.0)}>
              x1
          </button>
          <button onClick={() => changeZoomRate(2.0)}>
              x2
          </button>
          <button onClick={() => changeZoomRate(4.0)}>
              x4
          </button>
          <button onClick={() => changeZoomRate(8.0)}>
              x8
          </button>
          <button onClick={() => changeZoomRate(16.0)}>
              x16
          </button>
          <button onClick={() => changeImageArea(current_img_num - 1 >= 0 ? current_img_num - 1: 0)}>
              --
          </button>
          <button onClick={() => changeImageArea(current_img_num + 1 < img_data.music.sp_num ? current_img_num + 1: img_data.music.sp_num)}>
              ++
          </button>
          <input type="checkbox" checked={relative} onChange={() => {setRelative(!relative)}}/>
            relative
        </div>
      </React.Fragment>
      );
    } else {
      return (
        <div className="button_area1">
          <button onClick={getSpectrumImg}>
            Load Spectrum
          </button>
        </div>
      );
    }
  }

  const stage_area = () => {
    if (data_ia_loaded) {
      return (
        <React.Fragment>
          <div className="Stage1">
            <p>Specgram x{zoom_rate}, {current_img_num}</p>
            <Stage width={window.innerWidth} height={740/2}>
              <Layer
                //onWheel={e => zoomStage(e)}
              >
                <Rect
                  x={0.0}
                  y={0.0}
                  width={window.innerWidth}
                  height={740/2}
                  fill="LightGray"
                />
                <URLImage
                  url={img_data.specgram.sp_img_paths[current_img_num]}
                  x={relative ? img_pos_x + (current_img_num * img_data.music.dt_num) * zoom_rate: img_pos_x}
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
              //onWheel={e => zoomStage(e)}
            >
              <Rect
                  x={0.0}
                  y={0.0}
                  width={window.innerWidth}
                  height={(740/2) + 40}
                  fill="LightGray"
              />
              <URLImage
                url={img_data.music.sp_img_paths[current_img_num]}
                x={relative ? img_pos_x + (current_img_num * img_data.music.dt_num) * zoom_rate: img_pos_x}
                y={20}
                scaleX={zoom_rate}
                scaleY={0.5}
                draggable={true}
                dragBoundFunc={(pos) => moveXImage(pos, "music")}
              />
              {localized_data.slice(1).filter(ld => ld[0] !== -1 && (parseFloat(ld[2]) >= (img_data.music.t_max / 992) * current_img_num * img_data.music.dt_num
                                                                     && parseFloat(ld[2]) < (img_data.music.t_max / 992) * (current_img_num + 2) * img_data.music.dt_num)).map(ld => {
                return (

                  <LocalizedData
                    key={"ss" + ld[0]}
                    x={relative ?
                        (((parseFloat(ld[2]) / img_data.music.t_max) * 992) * zoom_rate) + img_pos_x:
                        (((parseFloat(ld[2]) / img_data.music.t_max) * 992 - current_img_num * img_data.music.dt_num) * zoom_rate) + img_pos_x}
                    y={((-parseFloat(ld[4]) + 180) / 360) * (740 / 2) - 10 + 20}
                    draggable={parseInt(ld[0]) === ldata_is_selected}
                    width={((parseFloat(ld[3]) / img_data.music.t_max) * 992) * zoom_rate}
                    height={20}
                    fill="red"
                    stroke='black'
                    strokeWidth={2}
                    opacity={0.6}
                    isSelected={parseInt(ld[0]) === ldata_is_selected}
                    onSelect={() => setLDataIsSelected(parseInt(ld[0]))}
                    onChange={updateLocalizedInfo}
                    onDblClick={() => playWav(parseInt(ld[0]))}
                  />
                )})
              }
            </Layer>
          </Stage>
        </div>
      </React.Fragment>
      );
    } else {
      return <p>Please load spectrum data.</p>;
    }
  };

  const localized_data_area = () => {
    if (ldata_ia_loaded && ldata_is_selected >= 0) {
      const attr = ["iid", "sid", "time", "duration", "azimuth", "species"];
      return (
        <React.Fragment>
          <dev className="localized_info">
            <p>Localized Information</p>
            {localized_data.slice(1)[ldata_is_selected].map((d, i) => {
              return <ul>{attr[i]}: {d}</ul>
              })
            }
          </dev>
          <button onClick={deleteLocalizedData}>
              Delete
          </button>
        </React.Fragment>
      );
    }
    return;
  };

  return (
    <div className="Main">
      {op_button_area()}
      {stage_area()}
      {localized_data_area()}
    </div>
  );
}

export default Main;
