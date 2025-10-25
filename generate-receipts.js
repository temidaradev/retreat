#!/usr/bin/env node
/**
 * Generate sample receipt PDFs for testing the Receipt Store application
 * Run: npm install pdfkit && node generate-receipts.js
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Sample data for generating receipts
const STORES = [
    { name: "Best Buy", address: "123 Tech Street, San Francisco, CA 94103", phone: "(415) 555-0100" },
    { name: "Apple Store", address: "456 Innovation Ave, Cupertino, CA 95014", phone: "(408) 555-0200" },
    { name: "Amazon", address: "789 Prime Way, Seattle, WA 98101", phone: "(206) 555-0300" },
    { name: "Target", address: "321 Shopping Blvd, Minneapolis, MN 55403", phone: "(612) 555-0400" },
    { name: "Walmart", address: "654 Retail Road, Bentonville, AR 72716", phone: "(479) 555-0500" },
    { name: "Home Depot", address: "987 Construction St, Atlanta, GA 30339", phone: "(770) 555-0600" },
    { name: "Costco", address: "147 Wholesale Dr, Issaquah, WA 98027", phone: "(425) 555-0700" },
    { name: "IKEA", address: "258 Furniture Ln, Älmhult, Sweden", phone: "+46 476 555-0800" },
    { name: "Micro Center", address: "369 Computer Ct, Hilliard, OH 43026", phone: "(614) 555-0900" },
    { name: "REI", address: "753 Outdoor Way, Kent, WA 98032", phone: "(253) 555-1000" },
];

const ITEMS = [
    { name: "MacBook Pro 16\" M3", price: 2499.00, warrantyMonths: 12 },
    { name: "Dell XPS 15 Laptop", price: 1899.99, warrantyMonths: 12 },
    { name: "iPhone 15 Pro Max", price: 1199.00, warrantyMonths: 12 },
    { name: "Samsung 65\" QLED TV", price: 1599.99, warrantyMonths: 24 },
    { name: "Sony WH-1000XM5 Headphones", price: 399.99, warrantyMonths: 12 },
    { name: "KitchenAid Stand Mixer", price: 449.99, warrantyMonths: 12 },
    { name: "Dyson V15 Vacuum Cleaner", price: 649.99, warrantyMonths: 24 },
    { name: "Canon EOS R6 Camera", price: 2499.00, warrantyMonths: 12 },
    { name: "Herman Miller Aeron Chair", price: 1395.00, warrantyMonths: 144 },
    { name: "Ninja Foodi Air Fryer", price: 199.99, warrantyMonths: 12 },
];

function formatDate(date) {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatShortDate(date) {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

function generateReceiptPDF(filename, store, item, purchaseDate, warrantyMonths) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'LETTER', margin: 72 });
        const stream = fs.createWriteStream(filename);

        doc.pipe(stream);

        // Store header
        doc.fontSize(24)
            .font('Helvetica-Bold')
            .text(store.name, { align: 'center' });

        doc.fontSize(10)
            .font('Helvetica')
            .moveDown(0.3)
            .text(store.address, { align: 'center' })
            .text(store.phone, { align: 'center' });

        doc.moveDown(1);

        // Horizontal line
        doc.moveTo(72, doc.y)
            .lineTo(540, doc.y)
            .stroke();

        doc.moveDown(1);

        // Receipt details
        doc.fontSize(16)
            .font('Helvetica-Bold')
            .text('RECEIPT');

        doc.moveDown(0.5);

        doc.fontSize(11)
            .font('Helvetica')
            .text(`Date: ${formatDate(purchaseDate)}`)
            .text(`Time: ${formatTime(purchaseDate)}`);

        // Generate random receipt number
        const receiptNumber = Math.floor(Math.random() * 900000) + 100000;
        doc.text(`Receipt #: ${receiptNumber}`);

        doc.moveDown(1);

        // Another horizontal line
        doc.moveTo(72, doc.y)
            .lineTo(540, doc.y)
            .stroke();

        doc.moveDown(1);

        // Item details header
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .text('ITEM DESCRIPTION', 72, doc.y, { continued: true })
            .text('PRICE', { align: 'right' });

        doc.moveDown(0.5);

        doc.fontSize(11)
            .font('Helvetica')
            .text(item.name, 72, doc.y, { continued: true })
            .text(`$${item.price.toFixed(2)}`, { align: 'right' });

        doc.moveDown(1);

        // Subtotal, tax, total
        doc.moveTo(72, doc.y)
            .lineTo(540, doc.y)
            .stroke();

        doc.moveDown(0.5);

        const subtotal = item.price;
        const taxRate = 0.0825; // 8.25% tax
        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        doc.text('Subtotal:', 288, doc.y, { continued: true })
            .text(`$${subtotal.toFixed(2)}`, { align: 'right' });

        doc.text('Tax (8.25%):', 288, doc.y, { continued: true })
            .text(`$${tax.toFixed(2)}`, { align: 'right' });

        doc.fontSize(12)
            .font('Helvetica-Bold')
            .text('TOTAL:', 288, doc.y, { continued: true })
            .text(`$${total.toFixed(2)}`, { align: 'right' });

        doc.moveDown(1);

        // Payment method
        doc.fontSize(10)
            .font('Helvetica')
            .text('Payment Method: Credit Card **** **** **** 1234');

        doc.moveDown(1.5);

        // Warranty information
        doc.moveTo(72, doc.y)
            .lineTo(540, doc.y)
            .stroke();

        doc.moveDown(0.5);

        doc.fontSize(12)
            .font('Helvetica-Bold')
            .text('WARRANTY INFORMATION');

        doc.moveDown(0.5);

        const warrantyExpiry = addMonths(purchaseDate, warrantyMonths);

        doc.fontSize(10)
            .font('Helvetica')
            .text(`Warranty Period: ${warrantyMonths} months`)
            .text(`Purchase Date: ${formatShortDate(purchaseDate)}`)
            .text(`Warranty Expires: ${formatShortDate(warrantyExpiry)}`);

        doc.moveDown(1);

        doc.fontSize(9)
            .font('Helvetica-Oblique')
            .text('Keep this receipt for warranty claims and returns.');

        doc.moveDown(1.5);

        // Footer
        doc.moveTo(72, doc.y)
            .lineTo(540, doc.y)
            .stroke();

        doc.moveDown(0.5);

        doc.fontSize(9)
            .font('Helvetica')
            .text('Thank you for your purchase!', { align: 'center' })
            .text('For questions, visit our website or call customer service', { align: 'center' });

        // Finalize PDF
        doc.end();

        stream.on('finish', () => {
            console.log(`✓ Generated: ${path.basename(filename)}`);
            resolve();
        });

        stream.on('error', reject);
    });
}

async function main() {
    console.log('Generating 10 sample receipt PDFs...');
    console.log('-'.repeat(60));

    // Create receipts directory if it doesn't exist
    const receiptsDir = 'sample_receipts';
    if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir);
    }

    const baseDate = new Date();
    const promises = [];

    for (let i = 0; i < 10; i++) {
        // Randomly select store and item
        const store = STORES[Math.floor(Math.random() * STORES.length)];
        const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];

        // Generate a purchase date within the last 6 months
        const daysAgo = Math.floor(Math.random() * 180);
        const purchaseDate = new Date(baseDate);
        purchaseDate.setDate(purchaseDate.getDate() - daysAgo);

        // Create filename
        const sanitizedStore = store.name.replace(/\s+/g, '_');
        const sanitizedItem = item.name.substring(0, 20).replace(/\s+/g, '_').replace(/"/g, '');
        const filename = path.join(
            receiptsDir,
            `receipt_${String(i + 1).padStart(2, '0')}_${sanitizedStore}_${sanitizedItem}.pdf`
        );

        // Generate the PDF
        promises.push(generateReceiptPDF(filename, store, item, purchaseDate, item.warrantyMonths));
    }

    try {
        await Promise.all(promises);
        console.log('-'.repeat(60));
        console.log(`\n✅ Successfully generated 10 receipts in '${receiptsDir}/' directory`);
        console.log('\nYou can now upload these PDFs to test your receipt parsing functionality!');
    } catch (error) {
        console.error('❌ Error generating receipts:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    // Check if pdfkit is installed
    try {
        require.resolve('pdfkit');
        main();
    } catch (e) {
        console.error('❌ Error: pdfkit is not installed');
        console.error('\nPlease install pdfkit first:');
        console.error('  npm install pdfkit');
        console.error('\nThen run this script again:');
        console.error('  node generate-receipts.js');
        process.exit(1);
    }
}

