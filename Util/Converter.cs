using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.IO.Packaging;
using System.Linq;
using ExcelDataReader;
using Newtonsoft.Json;
using Volumen;
using Volumen.Models;

namespace Util
{
    public static class Converter
    {
        public static int Convert(string inputFile, string outFile)
        {
            if (!File.Exists(inputFile))
            {
                Console.Out.WriteLine($"File {inputFile} does not exist");
                return -1;
            }

            if (File.Exists(outFile))
            {
                Console.Out.WriteLine($"File {outFile} already exist");
                return -1;
            }

            Console.Out.WriteLine($"Processing file {inputFile}...");

            using (var zip = Package.Open(outFile, FileMode.CreateNew))
            {
                var document = new Document
                {
                    Date = DateTime.Now,
                    IsArchived = false,
                    Sheets = new Dictionary<string, string>()
                };

                using (var stream = File.Open(inputFile, FileMode.Open, FileAccess.Read))
                {
                    using (var reader = ExcelReaderFactory.CreateReader(stream))
                    {
                        var result = reader.AsDataSet(new ExcelDataSetConfiguration()
                        {
                            UseColumnDataType = true,
                            ConfigureDataTable = (tableReader) => new ExcelDataTableConfiguration
                            {
                                UseHeaderRow = false,
                                FilterRow = (rowReader) => rowReader.ResultsCount > 0,
                                FilterColumn = (rowReader, columnIndex) => columnIndex < 3
                            }
                        });

                        foreach (DataTable table in result.Tables)
                        {
                            if (table.Rows.Count == 0)
                            {
                                Console.Out.WriteLine($"Skipping empty sheet {table.TableName}");
                                continue;
                            }

                            Console.Out.WriteLine($"Processing sheet {table.TableName}");

                            var sheet = new Sheet
                            {
                                Id = Guid.NewGuid().ToString("D"),
                                Name = table.TableName,
                                Columns = new List<Column>
                                {
                                    new Column
                                    {
                                        Name = "A"
                                    },
                                    new Column
                                    {
                                        Name = "B"
                                    },
                                    new Column
                                    {
                                        Name = "C"
                                    }
                                }
                            };

                            document.Sheets.Add(sheet.Id, sheet.Name);

                            var i = 0;
                            foreach (DataRow r in table.Rows)
                            {
                                var row = new Row
                                {
                                    Cells = new Dictionary<string, string>()
                                };

                                var y = 0;
                                foreach (var o in r.ItemArray.Take(3))
                                {
                                    row.Cells.Add(y.ToString(), o.ToString());
                                    y++;
                                }

                                sheet.Rows.Add(i.ToString(), row);
                                i++;
                            }

                            var sheetUri = PackUriHelper.CreatePartUri(new Uri(".\\" + Path.GetFileName(sheet.Id + ".json"), UriKind.Relative));

                            if (zip.PartExists(sheetUri))
                            {
                                zip.DeletePart(sheetUri);
                            }

                            var sheetPart = zip.CreatePart(sheetUri, "", CompressionOption.Normal);
                            using (var stringStream = Streams.GenerateStreamFromString(JsonConvert.SerializeObject(sheet, Formatting.Indented)))
                            {
                                using (Stream dest = sheetPart.GetStream())
                                {
                                    Streams.CopyStream(stringStream, dest);
                                }
                            }
                        }
                    }
                }

                var uri = PackUriHelper.CreatePartUri(new Uri(".\\" + Path.GetFileName("Document.json"), UriKind.Relative));
                if (zip.PartExists(uri))
                {
                    zip.DeletePart(uri);
                }

                var docPart = zip.CreatePart(uri, "", CompressionOption.Normal);
                using (var stringStream = Streams.GenerateStreamFromString(JsonConvert.SerializeObject(document, Formatting.Indented)))
                {
                    using (Stream dest = docPart.GetStream())
                    {
                        Streams.CopyStream(stringStream, dest);
                    }
                }
            }

            return 0;
        }
    }
}
