using System;

namespace Util
{
    class Program
    {
        static int Main(string[] args)
        {
            if (args.Length < 2)
            {
                Console.WriteLine("Not enough parameters");
                Console.WriteLine("Usage: [input file] [output file]");
                return -1;
            }

            System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

            var result = Converter.Convert(args[0], args[1]);

            Console.WriteLine("Done");
            Console.ReadKey(true);

            return result;
        }
    }
}