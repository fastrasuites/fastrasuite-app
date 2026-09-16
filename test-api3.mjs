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
    
    // Test Locations
    console.log(`\nFetching locations from ${domain}/inventory/location/...`);
    const locRes = await fetch(`${domain}/inventory/location/`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!locRes.ok) console.log("Locations failed:", locRes.status, await locRes.text());
    else console.log("Locations OK! Array?", Array.isArray(await locRes.json()));

    // Test Vendors
    console.log(`\nFetching vendors from ${domain}/invoice/vendors/?vendor_type=supplier...`);
    const venRes = await fetch(`${domain}/invoice/vendors/?vendor_type=supplier`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!venRes.ok) console.log("Vendors failed:", venRes.status, await venRes.text());
    else {
        const vendorData = await venRes.json();
        console.log("Vendors OK! Array?", Array.isArray(vendorData), vendorData);
    }

  } catch (err) {
    console.error(err);
  }
}

testApi();
