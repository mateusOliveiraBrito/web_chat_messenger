﻿using Microsoft.AspNetCore.Mvc;

namespace web_chat_messenger.Controllers {
    public class HomeController : Controller {

        public ActionResult Login() {
            return View();
        }

        public ActionResult Cadastro() {
            return View();
        }

        public ActionResult Conversacao() {
            return View();
        }
    }
}