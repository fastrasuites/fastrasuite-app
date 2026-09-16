const { z } = require('zod');
console.log('Zod version placeholder (since version is not always in the object):', z.constructor.name);
try {
    const schema = z.object({ name: z.string() });
    console.log('Schema created successfully');
    console.log('Schema keys:', Object.keys(schema));
    // Check for _zod property which the error mentioned
    console.log('Has _zod property:', '_zod' in schema);
} catch (e) {
    console.error('Error testing zod:', e);
}
