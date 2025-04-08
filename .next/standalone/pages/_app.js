import "../styles/globals.css";
import Layout from "../components/Layout";
import Head from "next/head";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* DO NOT set a hard-coded <title> here unless needed */}
      </Head>
      <Component {...pageProps} />
    </>
  );
}


export default MyApp;

