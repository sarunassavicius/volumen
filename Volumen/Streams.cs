using System.IO;

namespace Volumen
{
    public static class Streams
    {
        public static void CopyStream(Stream inputStream, Stream outputStream, long bufferSize = 4096)
        {
            var bufferSizeToUse = inputStream.Length < bufferSize ? inputStream.Length : bufferSize;
            var buffer = new byte[bufferSizeToUse];
            var bytesRead = 0;
            long bytesWritten = 0;

            while ((bytesRead = inputStream.Read(buffer, 0, buffer.Length)) != 0)
            {
                outputStream.Write(buffer, 0, bytesRead);
                bytesWritten += bufferSizeToUse;
            }
        }

        public static Stream GenerateStreamFromString(string s)
        {
            var stream = new MemoryStream();
            var writer = new StreamWriter(stream);

            writer.Write(s);
            writer.Flush();
            stream.Position = 0;

            return stream;
        }
    }
}
