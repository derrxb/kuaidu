import lmdb, { open } from "lmdb";
import fs from "fs/promises";

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

    dictionary[chunks[0]] = {
      traditional: chunks[0],
      simplified: chunks[1],
      rawPinyin: definition.match(pattern)
        ? (definition.match(pattern)?.[0].slice(1, -1).split(" ") as string[])
        : [""],
      definition: definition.replace(pattern, "").split(" ").slice(2).join(" "),
      pinyin: [],
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
  for (let i = 0; i < ids.length; i += 1) {
    await database.put(ids[i], dictionary[ids[i]]);
  }
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
