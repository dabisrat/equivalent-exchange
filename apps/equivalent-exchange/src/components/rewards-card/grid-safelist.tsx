/**
 * Grid Safelist Component
 *
 * This component is never rendered but ensures Tailwind v4 includes
 * all grid utility classes needed for custom card layouts.
 *
 * Custom layouts store Tailwind classes in the database, so they won't
 * be detected during the build-time scan. This file forces them to be
 * included in the production build.
 *
 * DO NOT DELETE - Required for production builds
 */

export function GridSafelist() {
  return (
    <div className="hidden">
      {/* Grid column positioning */}
      <div className="col-start-1 col-start-2 col-start-3 col-start-4 col-start-5 col-start-6 col-start-7 col-start-8 col-start-9 col-start-10 col-start-11 col-start-12" />
      <div className="col-end-1 col-end-2 col-end-3 col-end-4 col-end-5 col-end-6 col-end-7 col-end-8 col-end-9 col-end-10 col-end-11 col-end-12 col-end-13" />

      {/* Grid row positioning */}
      <div className="row-start-1 row-start-2 row-start-3 row-start-4 row-start-5 row-start-6 row-start-7 row-start-8 row-start-9 row-start-10" />
      <div className="row-end-1 row-end-2 row-end-3 row-end-4 row-end-5 row-end-6 row-end-7 row-end-8 row-end-9 row-end-10 row-end-11" />

      {/* Grid spans */}
      <div className="col-span-1 col-span-2 col-span-3 col-span-4 col-span-5 col-span-6 col-span-7 col-span-8 col-span-9 col-span-10 col-span-11 col-span-12 col-span-full" />
      <div className="row-span-1 row-span-2 row-span-3 row-span-4 row-span-5 row-span-6 row-span-7 row-span-8 row-span-9 row-span-10 row-span-full" />

      {/* Grid templates */}
      <div className="grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4 grid-cols-5 grid-cols-6 grid-cols-7 grid-cols-8 grid-cols-9 grid-cols-10 grid-cols-11 grid-cols-12" />
      <div className="grid-rows-1 grid-rows-2 grid-rows-3 grid-rows-4 grid-rows-5 grid-rows-6 grid-rows-7 grid-rows-8 grid-rows-9 grid-rows-10" />

      {/* Justify self */}
      <div className="justify-self-auto justify-self-start justify-self-end justify-self-center justify-self-stretch" />

      {/* Align self */}
      <div className="self-auto self-start self-end self-center self-stretch self-baseline" />

      {/* Gap utilities often used with custom grids */}
      <div className="gap-0 gap-1 gap-2 gap-3 gap-4 gap-5 gap-6 gap-8 gap-10 gap-12 gap-16" />

      {/* Place items/content */}
      <div className="place-items-start place-items-end place-items-center place-items-stretch" />
      <div className="place-content-start place-content-end place-content-center place-content-stretch place-content-between place-content-around place-content-evenly" />
    </div>
  );
}
