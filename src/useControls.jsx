import { useEffect, useState, useRef } from "react";

export const useControls = (vehicleApi, chassisApi) => {
  let [controls, setControls] = useState({ });
  const jumpCount = useRef(0);
  
  const fpsRef = useRef(null);

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

  
// Create the FPS display element
useEffect(() => {
  const fpsDiv = document.createElement("div");
  fpsDiv.style.position = "fixed";
  fpsDiv.style.top = "10px";
  fpsDiv.style.left = "10px";
  fpsDiv.style.padding = "4px 8px";
  fpsDiv.style.background = "rgba(0, 0, 0, 0.4)";
  fpsDiv.style.color = "#00ff00";
  fpsDiv.style.fontSize = "14px";
  fpsDiv.style.fontFamily = "monospace";
  fpsDiv.style.zIndex = "9999";
  fpsDiv.style.borderRadius = "5px";
  fpsDiv.style.pointerEvents = "none";
  fpsRef.current = fpsDiv;

  document.body.appendChild(fpsDiv);

  return () => {
    document.body.removeChild(fpsDiv);
  };
}, []);

// Update the FPS value continuously
useEffect(() => {
  let lastTime = performance.now();
  let frameCount = 0;

  const updateFPS = (now) => {
    frameCount++;
    const delta = now - lastTime;
    if (delta >= 1000) {
      const fps = Math.round((frameCount * 1000) / delta);
      frameCount = 0;
      lastTime = now;

      if (fpsRef.current) {
        fpsRef.current.innerText = `FPS: ${fps}`;
      }
    }
    requestAnimationFrame(updateFPS);
  };

  requestAnimationFrame(updateFPS);
}, []);

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