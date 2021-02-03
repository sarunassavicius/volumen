using System.Collections.Generic;
using System.Threading.Tasks;
using Volumen.DTO;

namespace Service.Services
{
    public interface ISearchService
    {
        Task<List<SearchResult>> Find(string file, string key);
        void Stop();
    }
}