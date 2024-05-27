using Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Data
{
    public static class Seed
    {
        // Since Guest users are accessible to anyone for login, I do not mind showing their password,
        // if these were not meant for guest login I would have used environment variables to store the password
        public static async Task SeedData(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<AppRole>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<AppUser>>();

            string[] roleNames = { "Member", "Moderator", "Admin", "Guest" };
            foreach (var roleName in roleNames)
            {
                var roleExist = await roleManager.RoleExistsAsync(roleName);
                if (!roleExist)
                {
                    var roleResult = await roleManager.CreateAsync(new AppRole { Name = roleName });

                    if (!roleResult.Succeeded)
                    {
                        throw new InvalidOperationException($"Error seeding '{roleName}' role");
                    }
                }
            }

            var memberGuests = new List<AppUser>
            {
                new AppUser
                {
                    UserName = "testone",
                    FullName = "George Foreman",
                    Gender = "male",
                    Country = "United States",
                    DateOfBirth = new DateOnly(1980, 1, 10),
                    Created = DateTime.Now,
                },

                new AppUser
                {
                    UserName = "testtwo",
                    FullName = "Andreea Popescu",
                    Gender = "female",
                    Country = "Romania",
                    DateOfBirth = new DateOnly(2000, 5, 15),
                    Created = DateTime.Now,
                },

                new AppUser
                {
                    UserName = "testthree",
                    FullName = "Ravi Patel",
                    Gender = "male",
                    Country = "India",
                    DateOfBirth = new DateOnly(1985, 11, 20),
                    Created = DateTime.Now,
                },
            };

            foreach (var user in memberGuests)
            {
                var userExist = await userManager.FindByNameAsync(user.UserName);
                if (userExist == null)
                {
                    var userResult = await userManager.CreateAsync(user, "TestModPassword123");

                    if (!userResult.Succeeded)
                    {
                        throw new InvalidOperationException($"Error seeding '{user.UserName}' user");
                    }

                    userResult = await userManager.AddToRoleAsync(user, "Member");

                    if (!userResult.Succeeded)
                    {
                        throw new InvalidOperationException($"Error adding 'Member' role to '{user.UserName}' user");
                    }

                    userResult = await userManager.AddToRoleAsync(user, "Guest");

                    if (!userResult.Succeeded)
                    {
                        throw new InvalidOperationException($"Error adding 'Guest' role to '{user.UserName}' user");
                    }
                }
            }

            var moderatorGuests = new List<AppUser>
            {
                new AppUser
                {
                    UserName = "modone",
                    FullName = "Hikari Takahashi",
                    Gender = "female",
                    Country = "Japan",
                    DateOfBirth = new DateOnly(1992, 2, 28),
                    Created = DateTime.Now,
                },

                new AppUser
                {
                    UserName = "modtwo",
                    FullName = "Carlos Rivera",
                    Gender = "male",
                    Country = "Mexico",
                    DateOfBirth = new DateOnly(1958, 8, 5),
                    Created = DateTime.Now,
                },

                new AppUser
                {
                    UserName = "modthree",
                    FullName = "Anita Horvat",
                    Gender = "female",
                    Country = "Slovenia",
                    DateOfBirth = new DateOnly(1983, 4, 30),
                    Created = DateTime.Now,
                }
            };

            foreach (var user in moderatorGuests)
            {
                var userExist = await userManager.FindByNameAsync(user.UserName);
                if (userExist == null)
                {
                    var userResult = await userManager.CreateAsync(user, "TestPassword123");

                    if (!userResult.Succeeded)
                    {
                        throw new InvalidOperationException($"Error seeding '{user.UserName}' user");
                    }

                    
                    userResult = await userManager.AddToRoleAsync(user, "Moderator");

                    if (!userResult.Succeeded)
                    {
                        throw new InvalidOperationException($"Error adding 'Moderator' role to '{user.UserName}' user");
                    }

                    userResult = await userManager.AddToRoleAsync(user, "Guest");

                    if (!userResult.Succeeded)
                    {
                        throw new InvalidOperationException($"Error adding 'Guest' role to '{user.UserName}' user");
                    }
                }
            }
            var Adminuser = new List<AppUser>
            {
                new AppUser
                {
                    UserName = "adminone",
                    FullName = "Admin",
                    Gender = "female",
                    Country = "Japan",
                    DateOfBirth = new DateOnly(1992, 2, 28),
                    Created = DateTime.Now,
                }
            };

            foreach (var user in Adminuser)
            {
                var userExist = await userManager.FindByNameAsync(user.UserName);
                if (userExist == null)
                {
                    var userResult = await userManager.CreateAsync(user, "1412");

                    userResult = await userManager.AddToRoleAsync(user, "Admin");

                    if (!userResult.Succeeded)
                    {
                        throw new InvalidOperationException($"Error adding 'Moderator' role to '{user.UserName}' user");
                    }
                }
            }
            //var adminUser = await userManager.FindByNameAsync("adminone");
            //if (adminUser != null)
            //{
            //    if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
            //    {
            //        var adminRoleResult = await userManager.AddToRoleAsync(adminUser, "Admin");
            //        if (!adminRoleResult.Succeeded)
            //        {
            //            throw new InvalidOperationException("Error adding 'Admin' role to 'admin' user");
            //        }
            //    }
            //    if (!await userManager.IsInRoleAsync(adminUser, "Moderator"))
            //    {
            //        var memberRoleResult = await userManager.AddToRoleAsync(adminUser, "Moderator");
            //        if (!memberRoleResult.Succeeded)
            //        {
            //            throw new InvalidOperationException("Error adding 'Moderator' role to 'admin' user");
            //        }
            //    }
            //}
        }
    }
}
