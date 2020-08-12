import React, { useEffect, useContext } from 'react'
import Konva from 'konva';
import { Stage, Layer, Star, Text } from 'react-konva';
import request from "superagent";
import { UserCount } from '../App';

function sendData() {
    request
        .post("/api/sendData")
        .send({data: -999})
        .end((err, data) => {
        if (err) {
            console.error(err);
            return;
        }
            console.log(data.body);
            return;
    });
}

const Reset = () => {
  const [count, setCount] = useContext(UserCount);

  return (
    <div className="Reset">
      <div className="Window1">
        <button onClick={() => sendData()}>
          Click me
        </button>
      </div>
    </div>
  );
}

export default Reset;
