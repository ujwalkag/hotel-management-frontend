import { Toaster } from 'react-hot-toast';
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext"; // ✅ added
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <LanguageProvider> {/* ✅ wrap the app with language context */}
        <Toaster position="top-center" />
        <Component {...pageProps} />
      </LanguageProvider>
    </AuthProvider>
  );
}

