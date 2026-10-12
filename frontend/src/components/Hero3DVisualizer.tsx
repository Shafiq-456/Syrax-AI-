/**
 * Hero3DVisualizer.tsx — Premium interactive 3D intelligence core.
 * Features an evolving polyhedral core, dual orbiting glowing particle rings,
 * floating pulsing neural nodes, and gentle mouse-driven parallax.
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface Props {
  activeStage?: number; // 0-7
}

export default function Hero3DVisualizer({ activeStage = -1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef(activeStage);

  useEffect(() => {
    stageRef.current = activeStage;
  }, [activeStage]);

  useEffect(() => {
    if (REDUCED || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.z = 240;

    // ── 1. Central Translucent Geometric Core ───────────────────
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Inner glowing sphere (Nucleus)
    const nucleusGeo = new THREE.IcosahedronGeometry(22, 2);
    const nucleusMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x00f0ff),
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
    coreGroup.add(nucleusMesh);

    // Outer crystalline geodesic cage
    const cageGeo = new THREE.DodecahedronGeometry(36, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x8b5cf6),
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    coreGroup.add(cageMesh);

    // ── 2. Orbiting Particle Rings ──────────────────────────────
    function createParticleRing(radius: number, count: number, colorHex: number) {
      const ringGeo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const theta = (i / count) * Math.PI * 2;
        const r = radius + (Math.random() - 0.5) * 6;
        pos[i * 3] = Math.cos(theta) * r;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
        pos[i * 3 + 2] = Math.sin(theta) * r;
      }
      ringGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const ringMat = new THREE.PointsMaterial({
        color: colorHex,
        size: 2.2,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Points(ringGeo, ringMat);
    }

    const innerRing = createParticleRing(52, 90, 0x00f0ff);
    innerRing.rotation.x = Math.PI / 4;
    scene.add(innerRing);

    const outerRing = createParticleRing(74, 120, 0x8b5cf6);
    outerRing.rotation.x = -Math.PI / 3;
    outerRing.rotation.y = Math.PI / 6;
    scene.add(outerRing);

    // ── 3. Constellation Nodes & Neural Web ──────────────────────
    const NODE_COUNT = 45;
    const nodeGeo = new THREE.SphereGeometry(1.6, 6, 6);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x64748b });
    const nodes: THREE.Mesh[] = [];
    const nodePositions: THREE.Vector3[] = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const r = 85 + Math.random() * 65;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const m = new THREE.Mesh(nodeGeo, nodeMat.clone());
      m.position.set(x, y, z);
      scene.add(m);
      nodes.push(m);
      nodePositions.push(new THREE.Vector3(x, y, z));
    }

    // Connect close nodes with faint lines
    const lineGeo = new THREE.BufferGeometry();
    const linePositions: number[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        if (nodePositions[i].distanceTo(nodePositions[j]) < 55) {
          linePositions.push(
            nodePositions[i].x, nodePositions[i].y, nodePositions[i].z,
            nodePositions[j].x, nodePositions[j].y, nodePositions[j].z
          );
        }
      }
    }
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.4,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // ── 4. Mouse Interactive Parallax ───────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 25;
      targetY = y * 20;
    }
    window.addEventListener("mousemove", handleMouseMove);

    // ── 5. Responsive Resize ────────────────────────────────────
    function resize() {
      if (!canvas) return;
      const w = canvas.clientWidth || 400;
      const h = canvas.clientHeight || 400;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    // ── 6. Animation Loop ───────────────────────────────────────
    let rafId: number;
    let t = 0;

    function animate() {
      rafId = requestAnimationFrame(animate);
      t += 0.01;

      // Smooth mouse follow
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      coreGroup.rotation.y = t * 0.4 + mouseX * 0.02;
      coreGroup.rotation.x = t * 0.25 - mouseY * 0.02;

      innerRing.rotation.z = t * 0.35;
      outerRing.rotation.z = -t * 0.25;

      camera.position.x = mouseX * 0.3;
      camera.position.y = mouseY * 0.3;
      camera.lookAt(0, 0, 0);

      // Pulse core opacity
      nucleusMat.opacity = 0.65 + Math.sin(t * 2) * 0.2;

      // Color node meshes based on active stage
      const stage = stageRef.current;
      for (let i = 0; i < nodes.length; i++) {
        const mat = nodes[i].material as THREE.MeshBasicMaterial;
        const isLit = i < (stage + 1) * 6;
        const targetColor = isLit ? new THREE.Color(0x00f0ff) : new THREE.Color(0x334155);
        mat.color.lerp(targetColor, 0.06);
      }

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      nucleusGeo.dispose();
      nucleusMat.dispose();
      cageGeo.dispose();
      cageMat.dispose();
      innerRing.geometry.dispose();
      outerRing.geometry.dispose();
      lineGeo.dispose();
      lineMat.dispose();
    };
  }, []);

  if (REDUCED) {
    return (
      <div
        style={{
          width: "100%",
          height: 380,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle, rgba(0,240,255,0.08) 0%, transparent 70%)",
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: "50%",
            border: "2px dashed var(--cyan)",
            opacity: 0.6,
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 380, position: "relative", pointerEvents: "none" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
}
