// pages/_app.js
import "../styles/globals.css";
import Layout from "../components/Layout";
import Head from "next/head";
import { AuthProvider } from "../context/AuthContext"; // ✅ Import your context

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AuthProvider> {/* ✅ Wrap the app with AuthProvider */}
        <Layout> {/* Optional: wrap in layout if you use it globally */}
          <Component {...pageProps} />
        </Layout>
      </AuthProvider>
    </>
  );
}

export default MyApp;

