import * as fs from 'fs/promises';
import * as path from 'path';
import yaml from 'js-yaml';
import admin from 'firebase-admin';
import serviceAccount from '../../peg-2035-firebase-adminsdk-82ntw-e258e715a0.json' assert { type: 'json' };
const now = new Date();
const latestUpdated = `${now.getFullYear().toString().slice(-2)}:${String(now.getMonth() + 1).padStart(
  2,
  '0',
)}:${String(now.getDate()).padStart(2, '0')}:${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

const targetPath = path.resolve('../../appwriter2035/appwriter.com/site/electives');

const db = admin.firestore();

const listTopLevelFolders = async (directoryPath: string): Promise<void> => {
  const masterData: Array<FolderData> = []; // Updated type to FolderData

  try {
    // Read the directory contents
    const items = await fs.readdir(directoryPath, { withFileTypes: true });

    // Process each directory
    for (const item of items) {
      if (item.isDirectory()) {
        const folderData = await handleFolder(directoryPath, item.name);
        masterData.push(folderData);

        // Add to Firestore
        await addToFirestore(folderData);
      }
    }

    // Write the .master.yaml file
    const masterFilePath = path.join(directoryPath, '.master.yaml');
    const yamlContent = yaml.dump(masterData, { noRefs: true });
    await fs.writeFile(masterFilePath, yamlContent, 'utf8');
    // console.log(`.master.yaml written with ${masterData.length} entries.`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error processing directories: ${error.message}`);
    } else {
      console.error('An unknown error occurred');
    }
  }
};

type FolderData = {
  folderName: string;
  [key: string]: string | number | boolean | null | object | undefined;
};

const handleFolder = async (directoryPath: string, folderName: string): Promise<FolderData> => {
  const folderPath = path.join(directoryPath, folderName);
  const indexPath = path.join(folderPath, 'index.md');
  const dataPath = path.join(folderPath, 'index.json');

  const folderData: FolderData = { folderName };

  console.log(`Processing folder: ${folderName}`);
  console.log(returnStringWithSpaces(folderName));

  // Handle index.md
  try {
    await fs.access(indexPath);
    console.log(`Index file already exists in folder: ${folderName}`);
  } catch {
    const content = `---
  layout: layout-sidebar
  title: "${returnStringWithSpaces(folderName)}"
  eleventyNavigation:
    key: "${folderName}"
    title: "${returnStringWithSpaces(folderName)}"
    parent: electives
  # order: 42
---

# ${returnStringWithSpaces(folderName)} Elective
`;
    await fs.writeFile(indexPath, content, 'utf8');
    console.log(`Created index.md in folder: ${folderName}`);
  }

  // Handle index.json
  try {
    await fs.access(dataPath);
    console.log(`Data file already exists in folder: ${folderName}`);
    const dataContent = await fs.readFile(dataPath, 'utf8');
    const parsedData = JSON.parse(dataContent);

    // Dynamically assign all fields from index.json
    Object.assign(folderData, parsedData);
  } catch {
    const jsonData: FolderData = {
      folderName,
      name: returnStringWithSpaces(folderName),
      latestUpdated,
    };

    await fs.writeFile(dataPath, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`Created index.json in folder: ${folderName}`);

    // Dynamically assign all fields from generated jsonData
    Object.assign(folderData, jsonData);
  }
  folderData.latestUpdated = latestUpdated;
  return folderData;
};

const addToFirestore = async (folderData: FolderData): Promise<void> => {
  try {
    const collectionRef = db.collection('electives');
    await collectionRef.doc(folderData.folderName).set(folderData);
    console.log(`Added/Updated Firestore document for folder: ${folderData.folderName}`);
  } catch (error) {
    console.error(`Error adding to Firestore for folder "${folderData.folderName}": ${error}`);
  }
};

export const returnStringWithSpaces = (input: string): string => {
  const result = input.replace(/([a-z])([A-Z])/g, '$1 $2');
  return result.charAt(0).toUpperCase() + result.slice(1);
};

// Execute the function
listTopLevelFolders(targetPath);
