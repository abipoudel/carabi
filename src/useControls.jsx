import { useEffect, useState, useRef } from "react";

export const useControls = (vehicleApi, chassisApi) => {
  let [controls, setControls] = useState({ });
  const jumpCount = useRef(0);

  useEffect(() => {
    const keyDownPressHandler = (e) => {
      setControls((controls) => ({ ...controls, [e.key.toLowerCase()]: true }));
    }

    const keyUpPressHandler = (e) => {
      setControls((controls) => ({ ...controls, [e.key.toLowerCase()]: false }));
    }
  
    window.addEventListener("keydown", keyDownPressHandler);
    window.addEventListener("keyup", keyUpPressHandler);
    return () => {
      window.removeEventListener("keydown", keyDownPressHandler);
      window.removeEventListener("keyup", keyUpPressHandler);
    }
  }, []);

  useEffect(() => {
    if(!vehicleApi || !chassisApi) return;

    if (controls.w) {
      vehicleApi.applyEngineForce(150, 2);
      vehicleApi.applyEngineForce(150, 3);
    } else if (controls.s) {
      vehicleApi.applyEngineForce(-150, 2);
      vehicleApi.applyEngineForce(-150, 3);
    } else {
      vehicleApi.applyEngineForce(0, 2);
      vehicleApi.applyEngineForce(0, 3);
    }

    if (controls.a) {
      vehicleApi.setSteeringValue(0.35, 2);
      vehicleApi.setSteeringValue(0.35, 3);
      vehicleApi.setSteeringValue(-0.1, 0);
      vehicleApi.setSteeringValue(-0.1, 1);
    } else if (controls.d) {
      vehicleApi.setSteeringValue(-0.35, 2);
      vehicleApi.setSteeringValue(-0.35, 3);
      vehicleApi.setSteeringValue(0.1, 0);
      vehicleApi.setSteeringValue(0.1, 1);
    } else {
      for(let i = 0; i < 4; i++) {
        vehicleApi.setSteeringValue(0, i);
      }
    }

    if (controls.arrowdown)  chassisApi.applyLocalImpulse([0, -5, 0], [0, 0, +1]);
    if (controls.arrowup)    chassisApi.applyLocalImpulse([0, -5, 0], [0, 0, -1]);
    if (controls.arrowleft)  chassisApi.applyLocalImpulse([0, -5, 0], [-0.5, 0, 0]);
    if (controls.arrowright) chassisApi.applyLocalImpulse([0, -5, 0], [+0.5, 0, 0]);

    if (controls.r) {
      chassisApi.position.set(-1.5, 0.5, 3);
      chassisApi.velocity.set(0, 0, 0);
      chassisApi.angularVelocity.set(0, 0, 0);
      chassisApi.rotation.set(0, 0, 0);
    }

    // JUMP with spacebar, allow double jump only
    if (controls[" "]) {
      if (jumpCount.current < 2) {
        chassisApi.applyImpulse([0, 200, 0], [0, 0, 0]);
        jumpCount.current += 1;
      }
    }

  }, [controls, vehicleApi, chassisApi]);

  // Reset jumpCount when car touches the ground
  useEffect(() => {
    let landed = false;

    const unsubscribe = chassisApi.velocity.subscribe(([vx, vy, vz]) => {
      // Check if the car is near the ground (velocity in the Y direction is close to 0)
      if (Math.abs(vy) < 0.1 && !landed) {
        jumpCount.current = 0; // Reset jump count when landing
        landed = true;
      } else if (Math.abs(vy) > 0.2) {
        landed = false; // It's in the air again
      }
    });

    return () => {
      unsubscribe();
    };
  }, [chassisApi]);

  return controls;
}
