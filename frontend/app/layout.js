import "./globals.css";
import {Inter} from "next/font/google";
import {Providers} from "./providers";
import {Toaster} from "react-hot-toast";
import NextTopLoader from "nextjs-toploader";
const inter = Inter({subsets: ["latin"]});

export const metadata = {
  title: "Transport & Fleet Management System",
  description:
    "Comprehensive fleet management solution for transport businesses",
  keywords: "transport, fleet, management, logistics, vehicles, trips",
};

export default function RootLayout({children}) {
  return (
    <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
        <Providers>
          <NextTopLoader color="#7275F2" showSpinner={false}/>
          {children}
          <Toaster
            position="top-right"
            // toastOptions={{
            //   duration: 4000,
            //   style: {
            //     background: "hsl(var(--background))",
            //     color: "hsl(var(--foreground))",
            //     border: "1px solid hsl(var(--border))",
            //   },
            //   success: {
            //     iconTheme: {
            //       primary: "hsl(var(--primary))",
            //       secondary: "hsl(var(--primary-foreground))",
            //     },
            //   },
            //   error: {
            //     iconTheme: {
            //       primary: "hsl(var(--destructive))",
            //       secondary: "hsl(var(--destructive-foreground))",
            //     },
            //   },
            // }}
          />
        </Providers>
      </body>
    </html>
  );
}
