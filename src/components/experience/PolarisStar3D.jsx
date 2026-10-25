import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * =========================================================================
 * PolarisStar3D Component — Interactive Three.js 3D North Star Emblem
 * =========================================================================
 * 
 * Inspired by 3d-discovery.fr's beating mark canvas (sg-mark-heart):
 * - Real-time 3D North Star geometric octahedron crystal with warm amber light.
 * - Interactive hover rotation and gentle breathing pulse.
 */
export default function PolarisStar3D() {
  const mountRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 120;
    const height = container.clientHeight || 120;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch (e) {
      console.warn('WebGL not supported for PolarisStar3D:', e);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.8);

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Geometry: 3D North Star / Octahedron with wireframe inner star
    const geom = new THREE.OctahedronGeometry(1.1, 0);
    const wireGeom = new THREE.OctahedronGeometry(1.22, 1);

    const mat = new THREE.MeshBasicMaterial({
      color: 0x8A661C,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });

    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xE0BB53,
      wireframe: false,
      transparent: true,
      opacity: 0.25
    });

    const starMesh = new THREE.Mesh(geom, mat);
    const innerMesh = new THREE.Mesh(geom, innerMat);
    const outerWire = new THREE.Mesh(wireGeom, new THREE.MeshBasicMaterial({
      color: 0x111111,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    }));

    scene.add(starMesh);
    scene.add(innerMesh);
    scene.add(outerWire);

    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      starMesh.rotation.y = elapsed * 0.45;
      starMesh.rotation.x = Math.sin(elapsed * 0.3) * 0.3;

      innerMesh.rotation.y = elapsed * 0.45;
      innerMesh.rotation.x = Math.sin(elapsed * 0.3) * 0.3;

      outerWire.rotation.y = -elapsed * 0.2;
      outerWire.rotation.z = Math.cos(elapsed * 0.25) * 0.2;

      // Gentle breathing scale
      const scale = 1 + Math.sin(elapsed * 2) * 0.04;
      starMesh.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geom.dispose();
      wireGeom.dispose();
      mat.dispose();
      innerMat.dispose();
    };
  }, []);

  return (
    <div ref={mountRef} className="w-full h-full min-h-[120px] flex items-center justify-center cursor-pointer pointer-events-none" />
  );
}
