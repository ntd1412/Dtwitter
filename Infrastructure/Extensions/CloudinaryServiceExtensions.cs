using Application.Interfaces;
using CloudinaryDotNet;
using Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Extensions
{
    public static class CloudinaryServiceExtensions
    {
        public static IServiceCollection AddCloudinaryServices(this IServiceCollection services)
        {
            var cloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME") ?? "drfs6i5ik";
            var apiKey = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY") ?? "974963122377616";
            var apiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET") ?? "zalX2mXonArN8XHMlvDH5UR0Wd8";

            var account = new Account(cloudName, apiKey, apiSecret);

            var cloudinary = new Cloudinary(account);
            cloudinary.Api.Secure = true;

            services.AddSingleton(cloudinary);
            services.AddScoped<IPhotoService, PhotoService>();

            return services;
        }
    }
}