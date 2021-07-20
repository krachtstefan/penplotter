import * as THREE from "three";

import { Leva, button, folder, useControls } from "leva";
import {
  PenPosition,
  PenplotterInstruction,
} from "../../contexts/Penplotter/types";
import { Point2D, RotationSeq } from "../../lib/plotter-model/types";
import SvgParser, {
  returnPointsArrFromElement,
} from "../../lib/plotter-model/svg";
import {
  getDimensions,
  getLenghtByPoints,
  getPosition,
  mirrorY,
  move,
  scale,
} from "../../lib/plotter-model/math";

import BigDecimal from "decimal.js";
import { Canvas } from "react-three-fiber";
import Cylinder from "./Cylinder";
import Grid from "./Grid";
import Material from "./Material";
import React from "react";
import config from "../../config";
import dynamic from "next/dynamic";
import useWebSocket from "react-use-websocket";

const svgFile = preval`module.exports = require("fs").readFileSync("./assets/examples/everything.svg", "utf8")`;
const parsedSvg = new SvgParser(svgFile);

const Controls = dynamic(() => import("./Controls"), { ssr: false });

const elementsToDraw = parsedSvg
  .returnSupportedElements()
  .map((pl) => returnPointsArrFromElement(pl))
  .flat();

const { width, height } = getDimensions(elementsToDraw.flat());

const Penplotter: React.FC = () => {
  const { sendJsonMessage } = useWebSocket(config.websocket.address);
  const sendDrawJob = () => {
    sendJsonMessage({
      type: "SEND_DRAW_JOB",
      payload: plotterInstructions,
    });
  };
  const [
    {
      gridEnabled,
      boardWidth,
      boardHeight,
      cylinderDistance,
      paperCustomWidth,
      paperCustomHeight,
      paperTopDistance,
      paperPresets,
      paperPadding,
    },
    _set,
  ] = useControls(() => ({
    Settings: folder({
      gridEnabled: {
        value: false,
        label: "show grid",
      },
    }),
    Board: folder({
      boardWidth: {
        value: config.board.width,
        step: 1,
        ...config.board.range.width,
        label: "width",
      },
      boardHeight: {
        value: config.board.height,
        step: 1,
        ...config.board.range.height,
        label: "height",
      },
      cylinderDistance: {
        value: config.cylinder.distance,
        step: 1,
        min: 0,
        max: 1000,
        label: "cylinder distance",
      },
    }),
    Paper: folder({
      paperPresets: {
        label: "presets",
        options: {
          ...config.paper.presets,
          custom: null,
        },
      },
      paperCustomWidth: {
        value: config.paper.width,
        step: 1,
        min: 0,
        max: 500,
        label: "width",
        render: (get) => get("Paper.paperPresets") === null,
      },
      paperCustomHeight: {
        value: config.paper.height,
        step: 1,
        min: 0,
        max: 500,
        label: "height",
        render: (get) => get("Paper.paperPresets") === null,
      },
      paperPadding: {
        value: 25,
        step: 1,
        min: 0,
        max: 50,
        label: "padding",
      },
      paperTopDistance: {
        value: config.paper.topDistance,
        step: 1,
        min: 0,
        max: 800,
        label: "paper distance",
      },
    }),
    "Send draw instructions to Penplotter": button(() => sendDrawJob()),
  }));

  const paperWidth =
    paperPresets && paperPresets.width ? paperPresets.width : paperCustomWidth;
  const paperHeight =
    paperPresets && paperPresets.height
      ? paperPresets.height
      : paperCustomHeight;

  const scaling = Math.min(
    ...[
      new BigDecimal(paperWidth - paperPadding * 2)
        .div(new BigDecimal(width))
        .toNumber(),
      new BigDecimal(paperHeight - paperPadding * 2)
        .div(new BigDecimal(height))
        .toNumber(),
    ]
  );

  // add projection
  const mirroredY = elementsToDraw.map((el) => mirrorY(el));
  const scaled = mirroredY.map((x) => scale(x, scaling));
  const { width: scaledWidth, height: scaledHeight } = getDimensions(
    scaled.flat()
  );
  const left = getPosition(scaled.flat())[0];
  const top = getPosition(scaled.flat())[1];
  const moved = scaled.map((x) =>
    move(x, {
      down: top
        .times(-1)
        .minus(paperTopDistance)
        .minus(scaledHeight.div(2))
        .minus(new BigDecimal(paperHeight).div(2)),
      right: left
        .times(-1)
        .minus(new BigDecimal(paperWidth).div(2))
        .plus(new BigDecimal(paperWidth).minus(scaledWidth).div(2)),
    })
  );

  const upperLeft: Point2D = [
    new BigDecimal(-cylinderDistance).div(2),
    new BigDecimal(0),
  ];
  const upperRight: Point2D = [
    new BigDecimal(cylinderDistance).div(2),
    new BigDecimal(0),
  ];

  // const penPositions = moved.flat();

  const lengthSequence = moved.map((posArray) =>
    posArray.map((pos) => [
      getLenghtByPoints(upperLeft, pos),
      getLenghtByPoints(upperRight, pos),
    ])
  );

  const penHome = [
    getLenghtByPoints(upperLeft, [
      new BigDecimal(0),
      new BigDecimal(config.pen.topDistance),
    ]),
    getLenghtByPoints(upperRight, [
      new BigDecimal(0),
      new BigDecimal(config.pen.topDistance),
    ]),
  ];

  const lengthChangeSequence: Point2D[][] = lengthSequence.map(
    (line, elementIndex) =>
      line.map((co, i, srcArr) => {
        let prevPoint = srcArr[i - 1];
        // when a new line begins
        if (i === 0) {
          prevPoint =
            // the line draws from the pens homing position
            elementIndex === 0
              ? penHome
              : // or from the previous line
                [
                  lengthSequence[elementIndex - 1].slice(-1)[0][0],
                  lengthSequence[elementIndex - 1].slice(-1)[0][1],
                ];
        }
        return [prevPoint[0].minus(co[0]), prevPoint[1].minus(co[1])];
      })
  );

  const rotationDegSequence: RotationSeq[][] = lengthChangeSequence.map((s) =>
    s.map((x) => [
      x[0].div(config.cylinder.circumference).times(360).times(-1),
      x[1].div(config.cylinder.circumference).times(360),
    ])
  );

  const plotterInstructions: PenplotterInstruction[] =
    rotationDegSequence.reduce((acc, curr) => {
      const newLine: PenplotterInstruction[] = curr.map((rotation, i) => {
        const [left, right] = rotation;
        const throttleRight = right.abs().lessThan(left.abs());
        const throttleLeft = left.abs().lessThan(right.abs());
        return {
          left: left.toNumber(),
          right: right.toNumber(),
          leftThrottle:
            throttleLeft === true ? left.abs().div(right.abs()).toNumber() : 1,
          rightThrottle:
            throttleRight === true ? right.abs().div(left.abs()).toNumber() : 1,
          pen: i === 0 ? PenPosition.UP : PenPosition.DOWN,
        };
      });
      const rest = [...acc, ...newLine];
      return rest;
    }, [] as PenplotterInstruction[]);

  // const { penPositionX, penPositionY: _ } = useSpring({
  //   from: {
  //     penPositionX: [penPositions[0][0].toNumber()],
  //     penPositionY: [penPositions[0][1].toNumber()],
  //   },
  //   to: penPositions.slice(1).map((penPosition) => {
  //     return {
  //       penPositionX: penPosition[0].toNumber(),
  //       penPositionY: penPosition[1].toNumber(),
  //     };
  //   }),
  //   delay: 1000,
  // });

  return (
    <>
      <Canvas
        camera={{
          position: [20 * 10, 0, 75 * 10],
          far: 5000,
        }}
        onCreated={({ gl }) => gl.setClearColor("white")}
      >
        <group position={[0, 500, 0]}>
          <ambientLight intensity={1} />
          <pointLight position={[0, -boardHeight / 2, boardHeight]} />
          <Cylinder
            center={[
              -cylinderDistance / 2,
              -config.cylinder.diameter,
              config.cylinder.diameter,
            ]}
            diameter={config.cylinder.diameter}
          />
          <Cylinder
            center={[
              cylinderDistance / 2,
              -config.cylinder.diameter,
              config.cylinder.diameter,
            ]}
            diameter={config.cylinder.diameter}
          />
          <Material
            width={boardWidth}
            height={boardHeight}
            center={[0, -boardHeight / 2, -2]}
            color={"#22272e"}
          />
          <Material
            width={paperWidth}
            height={paperHeight}
            center={[0, -paperHeight / 2 - paperTopDistance, -1]}
            color={"white"}
          />
          {moved.map((el, i) => (
            <line
              key={i}
              // @ts-ignore */
              geometry={new THREE.BufferGeometry().setFromPoints(
                el.map(
                  (point) =>
                    new THREE.Vector3(
                      point[0].toNumber(),
                      point[1].toNumber(),
                      2
                    )
                )
              )}
            >
              <lineBasicMaterial attach="material" color="#444c56" />
            </line>
          ))}
          {/* <animated.line
            geometry={penPositionX.interpolate((penX) => {
              return new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(
                  upperLeft[0].toNumber(),
                  upperLeft[1].toNumber(),
                  3
                ),
                new THREE.Vector3(penX, 0, 3),
                // new THREE.Vector3(penX, penPositionY.payload[0].value, 3),
                new THREE.Vector3(
                  upperRight[0].toNumber(),
                  upperRight[1].toNumber(),
                  3
                ),
              ]);
            })}
          >
            <lineBasicMaterial attach="material" color="#444c56" />
          </animated.line> */}

          {gridEnabled ? <Grid /> : null}
        </group>
        <Controls />
      </Canvas>
      <Leva hideCopyButton={true} />
    </>
  );
};

export default Penplotter;
