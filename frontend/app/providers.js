"use client";

import {Provider} from "react-redux";
import {useState, useEffect} from "react";
import {useDispatch} from "react-redux";
// import store from "@lib/store";
import {initializeAuth} from "@/lib/slices/authSlice";
import {ThemeProvider} from "next-themes";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import store from "@/lib/store";

function AuthInitializer({children}) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return children;
}

export function Providers({children}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange>
          <AuthInitializer>{children}</AuthInitializer>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
