/**
 * BackgroundScene.tsx
 * Three.js ambient particle node-graph that mounts to a fixed canvas and
 * cleans up its WebGL context on unmount. Completely separate from any
 * data/SSE logic — purely presentational.
 *
 * Design: floating nodes connected by dim lines; nodes light up in
 * accent-cyan when a stage completes.
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Stages that can "light up" a node
export type StageName =
  | "idea_analysis" | "search" | "rag" | "similarity"
  | "gaps" | "recommendations" | "architecture" | "report";

interface Props {
  /** Pass the index of the most recently completed stage (0-7) or -1 for none */
  activeStage?: number;
}

const NODE_COUNT  = 80;
const CONN_DIST   = 120; // world-units — nodes closer than this get a line
const ACCENT      = new THREE.Color(0x00d4ff);
const DIM_NODE    = new THREE.Color(0x1e1e28);
const DIM_EDGE    = new THREE.Color(0x1a1a24);

export default function BackgroundScene({ activeStage = -1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef  = useRef(activeStage);

  useEffect(() => { stageRef.current = activeStage; }, [activeStage]);

  useEffect(() => {
    if (REDUCED || !canvasRef.current) return;

    const canvas   = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
    camera.position.z = 400;

    // ── Nodes ────────────────────────────────────────────────
    const positions: THREE.Vector3[] = [];
    const nodeMeshes: THREE.Mesh[] = [];
    const sphereGeo = new THREE.SphereGeometry(3, 8, 8);

    for (let i = 0; i < NODE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 900;
      const y = (Math.random() - 0.5) * 600;
      const z = (Math.random() - 0.5) * 300;
      positions.push(new THREE.Vector3(x, y, z));

      const mat  = new THREE.MeshBasicMaterial({ color: DIM_NODE.clone() });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      nodeMeshes.push(mesh);
    }

    // ── Edges ─────────────────────────────────────────────────
    const edgeGeo = new THREE.BufferGeometry();
    const edgeVerts: number[] = [];
    const edgePairs: [number, number][] = [];

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (positions[i].distanceTo(positions[j]) < CONN_DIST) {
          edgeVerts.push(
            positions[i].x, positions[i].y, positions[i].z,
            positions[j].x, positions[j].y, positions[j].z,
          );
          edgePairs.push([i, j]);
        }
      }
    }
    edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgeVerts, 3));
    const edgeMat  = new THREE.LineBasicMaterial({ color: DIM_EDGE, transparent: true, opacity: 0.4 });
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    scene.add(edgeLines);

    // Assign each node to a stage bucket (0-7) so we know which ones to light up
    const STAGES = 8;
    const nodeBucket: number[] = nodeMeshes.map((_, i) =>
      Math.floor((i / NODE_COUNT) * STAGES)
    );

    // ── Resize ────────────────────────────────────────────────
    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    // ── Velocity for gentle drift ─────────────────────────────
    const velocity = positions.map(() => new THREE.Vector3(
      (Math.random() - 0.5) * 0.06,
      (Math.random() - 0.5) * 0.04,
      (Math.random() - 0.5) * 0.02,
    ));

    // ── Animation loop ────────────────────────────────────────
    let rafId: number;
    let t = 0;

    function animate() {
      rafId = requestAnimationFrame(animate);
      t += 0.005;

      const currentStage = stageRef.current;

      // Drift nodes
      for (let i = 0; i < nodeMeshes.length; i++) {
        const mesh = nodeMeshes[i];
        mesh.position.addScaledVector(velocity[i], 1);
        // Gentle bounds bounce
        if (Math.abs(mesh.position.x) > 450) velocity[i].x *= -1;
        if (Math.abs(mesh.position.y) > 310) velocity[i].y *= -1;
        if (Math.abs(mesh.position.z) > 160) velocity[i].z *= -1;
        positions[i].copy(mesh.position);

        // Color: lit if this node's bucket ≤ activeStage
        const mat = mesh.material as THREE.MeshBasicMaterial;
        const isLit = nodeBucket[i] <= currentStage;
        const targetColor = isLit ? ACCENT : DIM_NODE;
        mat.color.lerp(targetColor, 0.04);
      }

      // Rebuild edge positions (nodes have moved)
      const pos = edgeGeo.attributes.position;
      let vi = 0;
      for (const [i, j] of edgePairs) {
        pos.setXYZ(vi / 3, positions[i].x, positions[i].y, positions[i].z); vi += 3;
        pos.setXYZ(vi / 3, positions[j].x, positions[j].y, positions[j].z); vi += 3;
      }
      pos.needsUpdate = true;

      // Subtle camera sway
      camera.position.x = Math.sin(t * 0.3) * 30;
      camera.position.y = Math.cos(t * 0.2) * 20;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      sphereGeo.dispose();
      edgeGeo.dispose();
      edgeMat.dispose();
    };
  }, []); // mount once

  if (REDUCED) return null;

  return (
    <canvas
      ref={canvasRef}
      id="bg-canvas"
      aria-hidden="true"
    />
  );
}
