import lmdb, { open } from "lmdb";
import fs from "fs/promises";
import { memoizeGetToneFromPinyin } from "./pinyin";

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

const getBasicWords = async (path: string) => {
  const file = await fs.open(path);
  const dictString = await file.readFile({ encoding: "utf8" });
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
  const ids = Object.keys(dictionary);
  await Promise.all(
    ids.map((key, index) => database.put(ids[index], dictionary[ids[index]]))
  );
};

const getBlazingFastDatabase = async (dbPath: string, dictPath: string) => {
  const database = getDatabase(dbPath);
  const dictionary = await getBasicWords(dictPath);
  await saveDictionary(dictionary, database);
};

getBlazingFastDatabase(
  "./dictionary/fast-cedict",
  "./dictionary/raw-cedict.txt"
);
