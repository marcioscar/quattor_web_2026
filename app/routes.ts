import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"), 
    route("treinos", "routes/treinos.tsx"),
    route("login", "routes/login.tsx"),
    route("logout", "routes/logout.tsx"),
    route("aluno/:registration", "routes/aluno.tsx"),
   
] satisfies RouteConfig;
