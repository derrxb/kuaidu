import lmdb, { open } from "lmdb";
import fs from "fs/promises";
import { memoizeGetToneFromPinyin } from "./pinyin";
import chunk from "lodash/chunk";

const getDatabase = (path: string) => {
  return open({
    path,
    compression: true,
  });
};

type Dictionary = Record<
  string,
  {
    definition: string;
    traditional: string;
    simplified: string;
    rawPinyin: string[];
    pinyin: string[];
  }
>;

const getDictionaryString = async (path: string) => {
  const file = await fs.open(path);
  const dictString = await file.readFile({ encoding: "utf8" });
  return [dictString, file] as [string, typeof file];
};

const getBasicWords = async (path: string) => {
  const [dictString, file] = await getDictionaryString(path);
  const definitions = dictString.split("\r\n");
  const dictionary: Dictionary = {};
  const pattern = /\[([^\]]+)\]/;

  for (let i = 0; i < definitions.length; i += 1) {
    const definition = definitions[i];

    const chunks = definition?.split(" ");
    const rawPinyin = definition.match(pattern)
      ? (definition.match(pattern)?.[0].slice(1, -1).split(" ") as string[])
      : [""];

    dictionary[chunks[0]] = {
      rawPinyin,
      traditional: chunks[0],
      simplified: chunks[1],
      definition: definition.replace(pattern, "").split(" ").slice(2).join(" "),
      pinyin: await Promise.all(rawPinyin.map(memoizeGetToneFromPinyin)),
    };
  }

  await file.close();
  return dictionary;
};

const saveDictionary = async (
  dictionary: Dictionary,
  database: lmdb.RootDatabase<any, lmdb.Key>
) => {
  const ids: string[] = Object.keys(dictionary);
  const chunks = chunk(ids, 1000);
  const chunksOfChunks = chunks.map((bigChunk) => chunk(bigChunk, 100));

  for (
    let bigChunkIndex = 0;
    bigChunkIndex < chunksOfChunks.length;
    bigChunkIndex += 1
  ) {
    await Promise.all(
      chunksOfChunks[bigChunkIndex].map(async (babyChunk) => {
        // add these via promise
        return await Promise.all(
          babyChunk.map(async (key) => {
            return await database.put(key, dictionary[key]);
          })
        );
      })
    );
  }
};

const getBlazingFastDatabase = async (dbPath: string, dictPath: string) => {
  const database = getDatabase(dbPath);
  console.time("[Action] Formatting data");
  const dictionary = await getBasicWords(dictPath);
  console.timeEnd("[Action] Formatting data");

  console.time("[Action] Saving data");
  await saveDictionary(dictionary, database);
  console.timeEnd("[Action] Saving data");
};

const printSomeSampleData = async (
  dbPath: string,
  dictPath: string,
  count: number = 100
) => {
  const database = getDatabase(dbPath);
  const [dictString, file] = await getDictionaryString(dictPath);
  const definitions = dictString.split("\r\n");

  for (let i = 0; i < count; i += 1) {
    const key =
      definitions[Math.floor(Math.random() * definitions.length)]?.[0];
    console.log(database.get(key));
  }
};

getBlazingFastDatabase(
  "./dictionary/fast-cedict",
  "./dictionary/raw-cedict.txt"
);
