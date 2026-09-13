exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: ""
    };
  }

  // Hanya POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: "Method not allowed"
      })
    };
  }

  const query = event.body || "";

  if (!query.trim()) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "Query Overpass kosong"
      })
    };
  }

  /*
   * Beberapa server Overpass sebagai fallback.
   */
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter"
  ];

  for (const endpoint of endpoints) {
    const controller = new AbortController();

    // Beri waktu lebih lama untuk query seluruh Aceh
    const timeout = setTimeout(() => {
      controller.abort();
    }, 60000);

    try {
      console.log("Mencoba Overpass:", endpoint);

      const response = await fetch(endpoint, {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded; charset=UTF-8",

          "User-Agent":
            "NangkringAceh/1.0"
        },

        body:
          "data=" +
          encodeURIComponent(query),

        signal: controller.signal
      });

      const text = await response.text();

      console.log(
        "Overpass status:",
        endpoint,
        response.status,
        "bytes:",
        text.length
      );

      if (
        response.ok &&
        text.trim().startsWith("{")
      ) {
        return {
          statusCode: 200,
          headers,
          body: text
        };
      }

      console.log(
        "Response Overpass tidak valid:",
        text.substring(0, 300)
      );

    } catch (error) {

      console.log(
        "Endpoint gagal:",
        endpoint,
        error.message
      );

    } finally {

      clearTimeout(timeout);

    }
  }

  return {
    statusCode: 502,
    headers,
    body: JSON.stringify({
      error:
        "Server Overpass sedang tidak merespons. Silakan coba lagi beberapa saat."
    })
  };
};
