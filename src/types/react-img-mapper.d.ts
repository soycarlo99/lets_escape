declare module "react-img-mapper" {
  import React from "react";

  interface Area {
    name: string;
    shape: string;
    coords: number[];
    preFillColor?: string;
    fillColor?: string;
    [key: string]: any;
  }

  interface Map {
    name: string;
    areas: Area[];
  }

  interface ImageMapperProps {
    src: string;
    map: Map;
    width?: number;
    height?: number;
    imgWidth?: number;
    imgHeight?: number;
    responsive?: boolean;
    parentWidth?: number;
    onClick?: (area: Area, index: number, event: React.MouseEvent) => void;
    onMouseEnter?: (area: Area, index: number, event: React.MouseEvent) => void;
    onMouseLeave?: (area: Area, index: number, event: React.MouseEvent) => void;
    onMouseMove?: (area: Area, index: number, event: React.MouseEvent) => void;
    onImageClick?: (event: React.MouseEvent) => void;
    onImageMouseMove?: (event: React.MouseEvent) => void;
    [key: string]: any;
  }

  const ImageMapper: React.FC<ImageMapperProps>;

  export default ImageMapper;
}
