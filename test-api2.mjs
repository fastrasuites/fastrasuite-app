import fs from 'fs';

async function testApi() {
  try {
    const loginRes = await fetch("https://www.fastrasuiteapi.com.ng/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "efemiayafavour@gmail.com", password: "Quasa12345." })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.access_token;
    const tenant = loginData.tenant_schema_name;
    const domain = `https://${tenant}.fastrasuiteapi.com.ng`;
    
    console.log(`\nFetching purchase products from ${domain}/purchase/products/...`);
    const prodRes = await fetch(`${domain}/purchase/products/`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (!prodRes.ok) {
      console.log("Products failed:", prodRes.status, await prodRes.text());
    } else {
      const prodData = await prodRes.json();
      console.log("Purchase Products Data Structure:", JSON.stringify(prodData).substring(0, 500) + "...");
      console.log("Is Array?", Array.isArray(prodData));
    }

  } catch (err) {
    console.error(err);
  }
}

testApi();
