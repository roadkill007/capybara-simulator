/**
 * Instanced Grass — inspired by 3DNature's foliage density/ecosystem algorithms
 * Uses THREE.InstancedBufferGeometry + custom wind shader for GPU-batched grass
 */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Wind shader ───────────────────────────────────────────────────────────────
const GRASS_VERT = /* glsl */ `
  attribute vec3 instanceOffset;
  attribute vec3 instanceColor;
  varying vec3 vColor;
  varying float vHeight;
  uniform float uTime;
  uniform float uWindStrength;

  void main() {
    vColor = instanceColor;
    vHeight = position.y;

    // Wind sway — tips sway more than base
    float tipFactor = clamp(vHeight / 0.45, 0.0, 1.0);
    float windX = sin(uTime * 1.4 + instanceOffset.x * 0.8 + instanceOffset.z * 0.6) * uWindStrength * tipFactor;
    float windZ = cos(uTime * 1.1 + instanceOffset.z * 0.7 + instanceOffset.x * 0.5) * uWindStrength * 0.5 * tipFactor;

    // Rotate blade by angle stored in instanceOffset.y
    float angle = instanceOffset.y;
    float cosA = cos(angle);
    float sinA = sin(angle);
    vec3 worldPos = position;
    float rx = worldPos.x * cosA - worldPos.z * sinA;
    float rz = worldPos.x * sinA + worldPos.z * cosA;
    worldPos.x = rx + windX;
    worldPos.z = rz + windZ;
    worldPos.x += instanceOffset.x;
    worldPos.z += instanceOffset.z;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
  }
`;

const GRASS_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vHeight;

  void main() {
    float h = clamp(vHeight / 0.45, 0.0, 1.0);
    vec3 col = mix(vColor * 0.48, vColor * 1.28, h);
    gl_FragColor = vec4(col, 1.0);
  }
`;

// ── Helper: biome grass color ─────────────────────────────────────────────────
function grassColor(x: number, z: number, isDark: boolean): [number, number, number] {
  let c: THREE.Color;
  if (x < -18 && z > 18)  c = new THREE.Color(0xA0922A); // Savanna
  else if (x > 18 && z > 18)  c = new THREE.Color(0xBFAA55); // Desert
  else if (x < -18 && z < -18) c = new THREE.Color(0x2E7D32); // Jungle
  else if (x > 18 && z < -18)  c = new THREE.Color(0x5A7A4A); // Mountain
  else c = new THREE.Color(0x4A9A30); // Meadow

  const v = (isDark ? 0.42 : 0.88) + Math.random() * 0.22;
  return [c.r * v, c.g * v, c.b * v];
}

function shouldSpawn(x: number, z: number): boolean {
  if (x > 18 && z > 18)  return Math.random() < 0.28; // sparse desert
  if (x < -18 && z < -18) return Math.random() < 0.92; // dense jungle
  return Math.random() < 0.72;
}

// ── Component ─────────────────────────────────────────────────────────────────
const BLADE_COUNT = 5500;
const FIELD_HALF  = 55;

export function InstancedGrass({ isDark }: { isDark: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const { geometry, material } = useMemo(() => {
    // ─ Build per-instance data ─
    const offsets = new Float32Array(BLADE_COUNT * 3);
    const colors  = new Float32Array(BLADE_COUNT * 3);

    let idx = 0;
    let attempts = 0;
    while (idx < BLADE_COUNT && attempts < BLADE_COUNT * 6) {
      attempts++;
      const x = (Math.random() - 0.5) * FIELD_HALF * 2;
      const z = (Math.random() - 0.5) * FIELD_HALF * 2;

      // Avoid ponds
      const d1 = Math.sqrt((x - 12) ** 2 + (z + 10) ** 2);
      const d2 = Math.sqrt((x + 20) ** 2 + (z - 15) ** 2);
      const d3 = Math.sqrt((x - 30) ** 2 + (z - 25) ** 2);
      if (d1 < 11 || d2 < 9 || d3 < 7) continue;

      if (!shouldSpawn(x, z)) continue;

      // X offset, Y = random yaw angle, Z offset
      offsets[idx * 3 + 0] = x;
      offsets[idx * 3 + 1] = Math.random() * Math.PI * 2;
      offsets[idx * 3 + 2] = z;

      const [r, g, b] = grassColor(x, z, isDark);
      colors[idx * 3 + 0] = r;
      colors[idx * 3 + 1] = g;
      colors[idx * 3 + 2] = b;

      idx++;
    }
    const finalCount = idx;

    // ─ Build blade geometry (InstancedBufferGeometry) ─
    const geo = new THREE.InstancedBufferGeometry();
    const bladeH = 0.45;
    // Triangle: left-base, right-base, tip
    const positions = new Float32Array([
      -0.038, 0,      0,
       0.038, 0,      0,
       0,     bladeH, 0,
    ]);
    const uvs = new Float32Array([0, 0, 1, 0, 0.5, 1]);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex([0, 1, 2]);
    // Per-instance attributes
    geo.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute(offsets.slice(0, finalCount * 3), 3));
    geo.setAttribute('instanceColor',  new THREE.InstancedBufferAttribute(colors.slice(0, finalCount * 3),  3));
    geo.instanceCount = finalCount;

    // ─ Shader material ─
    const mat = new THREE.ShaderMaterial({
      vertexShader: GRASS_VERT,
      fragmentShader: GRASS_FRAG,
      uniforms: {
        uTime:         { value: 0 },
        uWindStrength: { value: 0.11 },
      },
      side: THREE.DoubleSide,
    });

    return { geometry: geo, material: mat };
  }, [isDark]);

  useFrame((_, dt) => {
    if (material.uniforms) {
      material.uniforms.uTime.value += dt;
    }
  });

  return (
    <mesh geometry={geometry} material={material} frustumCulled={false} />
  );
}
