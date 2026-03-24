import React from "react";
import svgPaths from "./svg-og743rcmcv";

function LogoPlaceholderUnion({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-[16px] relative shrink-0 w-[72px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 72 16">
        <g id="Union">{children}</g>
      </svg>
    </div>
  );
}

export default function LogoPlaceholder() {
  return (
    <div className="relative size-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center relative">
          <div className="bg-[#0e9586] overflow-clip relative rounded-[8px] shrink-0 size-[32px]" data-name="Favicon">
            <div className="-translate-x-1/2 absolute aspect-[24/24] bottom-[18.75%] left-1/2 top-[18.75%]" data-name="Vector">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                <g id="Vector">
                  <path d={svgPaths.p3b3ebb00} fill="var(--fill-0, white)" />
                  <path d={svgPaths.p1174e200} fill="var(--fill-0, white)" />
                </g>
              </svg>
            </div>
          </div>
          {"Light" === "Light" && true && (
            <LogoPlaceholderUnion>
              <path clipRule="evenodd" d={svgPaths.p2eac2e00} fill="var(--fill-0, #1A1A1A)" fillRule="evenodd" />
              <path clipRule="evenodd" d={svgPaths.p1a24780} fill="var(--fill-0, #1A1A1A)" fillRule="evenodd" />
              <path d={svgPaths.p2452c00} fill="var(--fill-0, #1A1A1A)" />
              <path d={svgPaths.p38897900} fill="var(--fill-0, #1A1A1A)" />
              <path d={svgPaths.p3620480} fill="var(--fill-0, #1A1A1A)" />
            </LogoPlaceholderUnion>
          )}
          {"Light" === "Dark" && true && (
            <LogoPlaceholderUnion>
              <path clipRule="evenodd" d={svgPaths.p2eac2e00} fill="var(--fill-0, white)" fillRule="evenodd" />
              <path clipRule="evenodd" d={svgPaths.p1a24780} fill="var(--fill-0, white)" fillRule="evenodd" />
              <path d={svgPaths.p2452c00} fill="var(--fill-0, white)" />
              <path d={svgPaths.p38897900} fill="var(--fill-0, white)" />
              <path d={svgPaths.p3620480} fill="var(--fill-0, white)" />
            </LogoPlaceholderUnion>
          )}
        </div>
      </div>
    </div>
  );
}