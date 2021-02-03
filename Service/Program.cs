using System.IO;
using Microsoft.AspNetCore.Hosting;

namespace Service
{
    public class Program
    {
        public static int Main(string[] args)
        {
            var host = new WebHostBuilder()
                .UseKestrel()
                .UseUrls("http://localhost:10001")
                .UseContentRoot(Directory.GetCurrentDirectory())
                .UseStartup<Startup>()
                .Build();
            host.Run();

            return 0;
        }
    }
}
