using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Service.Services;
using Volumen.Models;

namespace Service.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class SearchController : Controller
    {
        private readonly ISearchService searchService;

        public SearchController(ISearchService searchService)
        {
            this.searchService = searchService;
        }

        [HttpGet("{file}/{key}")]
        public async Task<IActionResult> Find(string file, string key)
        {
            return Json(await searchService.Find(file, key));
        }

        [HttpPost("stop")]
        public IActionResult Stop()
        {
            searchService.Stop();
            return Ok();
        }
    }
}
