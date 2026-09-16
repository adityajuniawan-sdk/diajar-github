import fs from "fs/promises";

export async function readJson(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Gagal membaca file:", filePath);
    console.error(error.message);
    throw error;
  }
}

export async function writeJson(filePath, data) {
  try {
    await fs.writeFile(
      filePath,
      JSON.stringify(data, null, 2),
      "utf-8"
    );
  } catch (error) {
    console.error("Gagal menyimpan file:", filePath);
    console.error(error.message);
    throw error;
  }
}