"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";

type SpeciesKey = "dragon" | "owl" | "fox";

// 3D 萌宠按需加载:three.js/R3F 只在 /pet 页拉取,不拖累全站首屏体积
const PetCreature3D = dynamic(() => import("./pet-creature-3d"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto flex h-60 w-full max-w-[20rem] items-center justify-center text-sm text-faint">
      萌宠来啦…
    </div>
  ),
});

/** WebGL 不可用 / 3D 出错时,优雅降级回静态插画 */
class WebGLBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function PetCompanion({
  image,
  name,
  species,
}: {
  image: string;
  name: string;
  species: SpeciesKey;
}) {
  return (
    <WebGLBoundary
      fallback={
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" aria-hidden className="pet-idle mx-auto h-44 w-44 object-contain" />
      }
    >
      <PetCreature3D species={species} name={name} />
    </WebGLBoundary>
  );
}
