import fetch from 'node-fetch';

async function testApi() {
  console.log("Testing API endpoints...");
  
  try {
    // Test DB status
    console.log("\nTesting /api/auth/db-status...");
    const dbStatusResponse = await fetch('http://localhost:5000/api/auth/db-status', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (dbStatusResponse.headers.get('content-type')?.includes('text/html')) {
      console.log("Received HTML response instead of JSON. This indicates a routing issue.");
      const html = await dbStatusResponse.text();
      console.log("Response preview:", html.substring(0, 100) + "...");
    } else {
      const dbStatus = await dbStatusResponse.json();
      console.log("Response:", dbStatus);
    }
    
    // Test signup endpoint
    console.log("\nTesting /api/auth/signup...");
    const signupResponse = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: 'testapi',
        email: 'testapi@example.com',
        password: 'password123'
      })
    });
    
    if (signupResponse.headers.get('content-type')?.includes('text/html')) {
      console.log("Received HTML response instead of JSON. This indicates a routing issue.");
      const html = await signupResponse.text();
      console.log("Response preview:", html.substring(0, 100) + "...");
    } else {
      const signupResult = await signupResponse.json();
      console.log("Response:", signupResult);
    }
    
  } catch (error) {
    console.error("Error testing API:", error);
  }
}

testApi().then(() => console.log("API test completed"));