import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import { db, doc, setDoc, getDoc } from "../firebase/firebaseConfig"; 

const FaceLogin = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [savedDescriptor, setSavedDescriptor] = useState(null);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      setIsLoading(false);
    };
    
    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Error accessing webcam: ", err));
  };

  const captureFace = async () => {
    const video = videoRef.current;
    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
  
    if (!detections) {
      alert("No face detected. Try again.");
      return;
    }
  
    const descriptorArray = Array.from(detections.descriptor);
  
    try {
      await setDoc(doc(db, "users", "user1"), { faceDescriptor: descriptorArray });
      alert("Face saved in Firebase!");
    } catch (error) {
      console.error("Error saving face data:", error);
    }
  };
  
  const verifyFace = async () => {
    const docRef = doc(db, "users", "user1");
    const docSnap = await getDoc(docRef);
  
    if (!docSnap.exists()) {
      alert("No saved face data. Please register first.");
      return;
    }
  
    const storedDescriptor = new Float32Array(docSnap.data().faceDescriptor);
  
    const video = videoRef.current;
    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
  
    if (!detections) {
      alert("No face detected.");
      return;
    }
  
    const labeledDescriptors = [new faceapi.LabeledFaceDescriptors("User", [storedDescriptor])];
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors);
  
    const bestMatch = faceMatcher.findBestMatch(detections.descriptor);
  
    if (bestMatch.label === "User") {
      setIsAuthenticated(true);
      alert("Login successful! 🎉");
    } else {
      alert("Face not recognized. Try again.");
    }
  };
  
  
  

  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-xl font-bold">Face Recognition Login</h2>
      {isLoading ? <p>Loading models...</p> : <p>Models loaded. Start webcam.</p>}

      <video ref={videoRef} autoPlay muted width="640" height="480" className="border rounded-lg my-2" />
      <canvas ref={canvasRef} className="absolute" />

      <button onClick={startVideo} className="bg-blue-500 text-white px-4 py-2 mt-2 rounded">Start Webcam</button>

      <div className="flex gap-2 mt-4">
        <button onClick={captureFace} className="bg-green-500 text-white px-4 py-2 rounded">Register Face</button>
        <button onClick={verifyFace} className="bg-yellow-500 text-white px-4 py-2 rounded">Login</button>
      </div>

      {isAuthenticated && <p className="text-green-500 mt-4">✅ Welcome! You are logged in.</p>}
    </div>
  );
};

export default FaceLogin;
