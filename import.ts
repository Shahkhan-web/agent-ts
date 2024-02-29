import { Product } from './entity'; // path to your Product entity 
import { dataSource as connection } from "./config";
import fs from 'fs/promises';
import fetch from 'node-fetch';

const filePath = './data.json';
const apiUrl = 'https://ffpwdprd.ffpgroup.net:44300/sap/opu/odata/sap/zif_mat_exp_det_srv/itemhdSet?saml2=disabled';
const auth = {
    username: 'NUWAD',
    password: 'Abcd@1234'
};

const importJsonFromFile = async () => {
    try {
        await fs.access(filePath, fs.constants.F_OK);
        const jsonData = await import(filePath);
        console.log('file exists importing data to sql')
        return jsonData
    } catch (error) {
        console.error("File doesn't exist. Fetching data from API...");
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'X',
                    'Authorization': `Basic ${Buffer.from(auth.username + ":" + auth.password).toString('base64')}`
                },
                body: JSON.stringify({
                    "Mat": "50487624",
                    "Plant": "4580",
                    "Sloc": "",
                    "Year": "",
                    "Mon": "",
                    "Batch": "",
                    "ProdDat": "",
                    "ExpDat": "10.02.1900",
                    "itemdetset": []
                })
            });
            console.log(response)
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }
            const json = await response.json();
            await fs.writeFile(filePath, JSON.stringify(json));
            return await import(filePath);
        } catch (error: any) {
            console.error('Error fetching data from API:', error.message);
        }
    }
}

const storeData = async () => {
    if (!connection.isConnected) {
        await connection.connect();
        console.log('Connected to database');

        const productRepository = connection.getRepository(Product);
        let data: any = await importJsonFromFile();
        for (const item of data.d.itemdetset.results) {
            console.log('items:', item)
            const product = new Product();
            product.mat = item.Mat || "N/A";
            product.name = item.Name || "N/A";
            product.plant = item.Plant || "N/A";
            product.sloc = item.Sloc || "N/A";
            product.year = item.Year || "N/A";
            product.mon = item.Mon || "N/A";
            product.batch = item.Batch || "N/A";
            product.proddat = item.ProdDat || "N/A";
            product.expdat = item.ExpDat || "N/A";
            product.qty = item.Qty || "N/A";

            console.log("Storing data:", product);
            try {
                await productRepository.save(product);
                console.log("Data stored successfully!");
            } catch (error) {
                console.error("Error storing data:", error);
            }
        }
    };

}


storeData();