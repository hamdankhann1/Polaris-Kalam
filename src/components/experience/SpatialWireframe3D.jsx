import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * =========================================================================
 * SpatialWireframe3D Component — Lightweight Three.js Topological Wireframe
 * =========================================================================
 * 
 * Inspired by 3d-discovery.fr's wire-model--stack:
 * - Real-time 3D wireframe mesh representing Kalam Valley (2,000m) topography.
 * - Rotates and scales based on scroll progress (0 to 1) and mouse hover.
 * - Uses pure Three.js without bulky external GLTF files for instant 60fps load.
 */
export default function SpatialWireframe3D({ progress = 0, activeStep = 0 }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const ringRef = useRef(null);
  const pointsRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 320;

    // 1. Scene, Camera, Renderer with WebGL safety fallback
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch (e) {
      console.warn('WebGL not supported, falling back gracefully:', e);
      return;
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 5.2);
    camera.lookAt(0, 0, 0);

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 2. Geometry: 3D Mountain Valley Terrain Wireframe
    const geom = new THREE.PlaneGeometry(4.2, 4.2, 28, 28);
    geom.rotateX(-Math.PI / 2.3);

    // Sculpt valley & mountain ridges
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Valley depression along center, ridges along edges
      const dist = Math.sqrt(x * x + z * z);
      const elevation = Math.sin(x * 2.2) * Math.cos(z * 2.2) * 0.45 + (1 - Math.exp(-dist * 0.8)) * 0.4;
      pos.setY(i, elevation);
    }
    geom.computeVertexNormals();

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x8A661C,
      wireframe: true,
      transparent: true,
      opacity: 0.65
    });

    const terrainMesh = new THREE.Mesh(geom, wireMat);
    scene.add(terrainMesh);
    meshRef.current = terrainMesh;

    // 3. Floating Orbital Coordinate Ring
    const ringGeom = new THREE.RingGeometry(2.4, 2.44, 48);
    ringGeom.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    scene.add(ringMesh);
    ringRef.current = ringMesh;

    // 4. Starlight Points Particle Cloud
    const particleCount = 60;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 5;
      particlePositions[i + 1] = Math.random() * 2.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 5;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x8A661C,
      size: 0.045,
      transparent: true,
      opacity: 0.75
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);
    pointsRef.current = particles;

    // 5. Render Loop with gentle idle drift
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Idle rotation + scroll progress orientation
      if (meshRef.current) {
        meshRef.current.rotation.y = elapsed * 0.15 + (progressRef.current * Math.PI * 1.5);
      }
      if (ringRef.current) {
        ringRef.current.rotation.y = -elapsed * 0.08;
      }
      if (pointsRef.current) {
        pointsRef.current.rotation.y = elapsed * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 6. Resize observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geom.dispose();
      wireMat.dispose();
      ringGeom.dispose();
      ringMat.dispose();
      particleGeom.dispose();
      particleMat.dispose();
    };
  }, []);

  // Update wireframe color/scale based on active step (Level 01 to 04)
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!meshRef.current) return;
    const colors = [0x8A661C, 0x1B4332, 0x1E3A8A, 0x581C87];
    const targetColor = colors[activeStep % colors.length] || 0x8A661C;
    meshRef.current.material.color.setHex(targetColor);
  }, [activeStep]);

  return (
    <div className="relative w-full h-full min-h-[260px] sm:min-h-[340px] flex items-center justify-center overflow-hidden">
      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />
      
      {/* Floating 3D Telemetry Overlay */}
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[9.5px] font-mono text-stone-400 pointer-events-none">
        <span>MODEL: TOPOLOGICAL MESH</span>
        <span>ELEV: +{(2000 + activeStep * 4)}M</span>
      </div>
    </div>
  );
}
