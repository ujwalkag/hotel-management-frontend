import { Toaster } from 'react-hot-toast';
import { AuthProvider } from "@/context/AuthContext";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Toaster position="top-center" /> {/* <= This line */}
      <Component {...pageProps} />
    </AuthProvider>
  );
}

