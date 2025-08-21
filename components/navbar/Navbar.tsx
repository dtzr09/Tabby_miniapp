import { Box } from "@mui/material";
import React from "react";

interface NavbarProps {
  title?: string;
}

const Navbar = ({ title }: NavbarProps) => {
  return <Box height={"48px"}>{title}</Box>;
};

export default Navbar;
