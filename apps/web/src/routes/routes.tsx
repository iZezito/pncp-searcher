import { useRoutes, Navigate } from "react-router";
import ProtectedRoute from "@/components/protected-route";
import PublicRoute from "@/components/public-route";
import { LoginForm } from "@/pages/login";
import NotFound from "@/pages/not-found";
import { SignupForm } from "@/pages/signup";
import Profile from "@/pages/profile";
import ForgotPasswordForm from "@/pages/forgot-password";
import ResetPasswordForm from "@/pages/reset-password";
import EmailValidation from "@/pages/validate-email";
import Home from "@/pages/home";
import { Roles } from "@/types";
import DeepSearch from "@/pages/deep-search";
import Planilhas from "@/pages/planilhas";
import EditarPlanilha from "@/pages/editar-planilha";

const allRoutes = () => {
  const publicRoutes = [
    {
      path: "/",
      element: <PublicRoute />,
      children: [{ path: "/home", element: <Home /> }],
    },
  ];

  const publicOnlyRoutes = [
    {
      path: "/",
      element: <PublicRoute onlyPublic />,
      children: [
        { path: "login", element: <LoginForm /> },
        { path: "signup", element: <SignupForm /> },
        { path: "forgot-password", element: <ForgotPasswordForm /> },
        { path: "reset-password", element: <ResetPasswordForm /> },
        { path: "validate-email", element: <EmailValidation /> },
      ],
    },
  ];

  const privateRoutes = [
    {
      path: "/",
      element: <ProtectedRoute allowedRoles={[Roles.DEFAULT]} />,
      children: [
        { index: true, element: <Navigate to="/planilhas" /> },
        { path: "profile", element: <Profile /> },
        { path: "planilhas", element: <Planilhas /> },
        { path: "planilhas/:id/editar", element: <EditarPlanilha /> },
        { path: "deep-search/:idPlanilha", element: <DeepSearch /> },
      ],
    },
  ];

  const notFoundRoute = [{ path: "*", element: <NotFound /> }];

  return [
    ...publicRoutes,
    ...publicOnlyRoutes,
    ...privateRoutes,
    ...notFoundRoute,
  ];
};

export default function Routes() {
  const appRoutes = allRoutes();
  return useRoutes(appRoutes);
}
