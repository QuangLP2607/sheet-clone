import { createHashRouter } from "react-router-dom";
import Layout from "@/Layout";
import Home from "@/pages/Home";

export const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [{ index: true, element: <Home /> }],
  },
]);
