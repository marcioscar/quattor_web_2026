import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"), 
    route("treinos/:registration", "routes/treinos.tsx"),
    route("login", "routes/login.tsx"),
    route("login/escolher", "routes/login.escolher.tsx"),
    route("primeiro-acesso", "routes/primeiro-acesso.tsx"),
    route("logout", "routes/logout.tsx"),
    route("aluno/:registration", "routes/aluno.tsx"),
    route("historico/:registration", "routes/historico.tsx"),
   
] satisfies RouteConfig;
