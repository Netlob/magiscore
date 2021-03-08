class ViewController {
  constructor(element, lineChart, pieChart, lessonController) {
    this.element = element[0];
    this.lineChart = false;
    this.lineChart2 = false;
    this.pieChart = false;
    this.barChart = false;
    this.generalBarChart = false;
    this.config = {};
    this.currentCourse = {};
    this.currentLesson = {};
    this.settingsOpen = false;
    this.iddinkInterval;
  }

  render(lesson) {
    if (lesson == "general") {
      this.renderGeneral();
    } else {
      this.renderLesson(lesson);
    }
    if (snapper.state().state == "left") snapper.close();
    $("#accordionSidebar .nav-item").each(function () {
      $(this).removeClass("active");
      if (
        $(this)
          .text()
          .trim() == lesson.trim() ||
        (lesson.trim() == "general" &&
          $(this)
            .text()
            .trim() == "Gemiddeld")
      )
        $(this).addClass("active");
    });
  }

  renderGeneral() {
    $("#lesson-wrapper").empty();
    $("#settings-wrapper").hide();
    $("#currentRender").html(`Gemiddeld`); // (${this.currentCourse.course.group.description})`);
    $("#currentRenderMobile").html(`Gemiddeld`); // (${this.currentCourse.course.group.description})`);
    $("#currentRender").html(
      `<span onclick="snapper.toggle('left')">Gemiddeld</span>`
    );
    $("#currentRenderMobile").html(
      `<span onclick="snapper.toggle('left')">Gemiddeld</span>`
    );
    if (!this.config.isDesktop) {
      $("#sidebarToggleTop").click();
    }
    $("#lineChart-container")
      .empty()
      .append(`<canvas id="lineChart""></canvas>`);
    $("#lineChart2-container")
      .empty()
      .append(`<canvas id="lineChart2""></canvas>`);
    $("#pieChart-container")
      .empty()
      .append(`<canvas id="pieChart""></canvas>`);
    $("#barChart-container")
      .empty()
      .append(`<canvas id="barChart""></canvas>`);
    $("#barChart-container-general")
      .empty()
      .append(`<canvas id="generalBarChart"></canvas>`);
    // $("#general-area-title").text(
    //   `Alle cijfers van ${course.type.description}`
    // );
    setChartData(this.config, "general", true);
    setTableData("general");
    setAverages();
    this.currentLesson = "general";
    this.initTheme();
    $('*[data-toggle="tooltip"]').tooltip();
    $("#general-wrapper").show();
    // window.ga.trackView('general')
    $(".vibrate").on("click", function () {
      vibrate(15, false);
    });
  }

  renderLesson(lesson) {
    // this.setConfig()
    var html = generateHTML(lesson);
    $("#lesson-wrapper")
      .empty()
      .html(html);
    $("#general-wrapper").hide();
    $("#settings-wrapper").hide();
    // $("#lesson-wrapper").show();
    $("#currentRender").html(
      `<span onclick="snapper.toggle('left')">${lesson}</span>`
    );
    $("#currentRenderMobile").html(
      `<span onclick="snapper.toggle('left')">${lesson}</span>`
    );
    if (!this.config.isDesktop) {
      $("#sidebarToggleTop").click();
    }
    setChartData(this.config, lesson);
    setTableData(lesson);
    this.currentLesson = lesson;
    this.initTheme();
    $('*[data-toggle="tooltip"]').tooltip();
    $("#lesson-wrapper").show();
    $(".vibrate").on("click", function () {
      vibrate(15, false);
    });
  }

  renderCourse(courseid, loader, course, lesson) {
    vibrate(15, false);
    if (loader) this.overlay("show");
    if (!courseid && course) viewController.currentCourse = course;
    else viewController.currentCourse = courseController.getCourse(courseid);
    if (
      lesson &&
      viewController.currentCourse.course.classes.findIndex(
        c => c.description.toLowerCase() == lesson.toLowerCase()
      ) > -1
    )
      main(lesson);
    else main();
    $("#years")
      .children()
      .removeClass("course-selected");
    $(`#course-${courseid}`).addClass("course-selected");
    $("#current-course-badge").text(
      this.currentCourse.course.group.description
    );
    setTimeout(function () {
      viewController.overlay("hide");
    }, 110);
  }

  renderGrade(gradeid) {
    var grade = courseController.allGrades.find(x => x.id == gradeid);
    $("#grade-modal-grade").text(grade.grade);
    $("#grade-modal-weight").text(grade.weight);
    $("#grade-modal-weight2").text(grade.weight);
    $("#grade-modal-description").text(
      grade.description == ""
        ? "<i>Geen beschrijving...</i>"
        : grade.description
    );
    $("#grade-modal-counts").text(grade.counts ? "Ja" : "Nee");
    $("#grade-modal-ispta").text(grade.type.isPTA ? "Ja" : "Nee");
    $("#grade-modal-teacher").text(grade.teacher.teacherCode);
    $("#grade-modal-date").text(toShortFormat(grade.dateFilledIn));

    $("#grade-modal-count").attr(
      "onchange",
      `lessonController.getLesson('${grade.class.description.capitalize()}').lesson.exclude('${grade.id
      }', this)`
    );
    $("#grade-modal-count").prop("checked", !grade.exclude);

    //                 <td>${grade.teacher.teacherCode}</td>
    //                 <td>${toShortFormat(grade.dateFilledIn)}</td>
    // <li><b>Weging</b><br><span id="grade-modal-weight2"></span>x</li>
    // <li><b>Omschrijving</b><br><span id="grade-modal-description"></span></li>
    // <li><b>Telt mee</b><br><span id="grade-modal-counts"></span></li>
    // <li><b>Is PTA</b><br><span id="grade-modal-ispta"></span></li>
    // <li><b>Ingevuld door</b><br><span id="grade-modal-teacher"></span></li>
    // <li><b>Ingevuld op</b><br><span id="grade-modal-date"></span></li>
  }

  updateNav() {
    updateSidebar();
    this.setCourses();
    // this.setLatestGrades(courseController.latestGrades);
    // logConsole(courseController.allGrades)
  }

  downloadGraph() {
    var newCanvas = document.querySelector("#lineChart");
    var newCanvasImg = newCanvas.toDataURL("image/png", 1.0);
    var doc = new jsPDF("landscape");
    doc.setFontSize(20);
    doc.text(
      15,
      15,
      `${$("#userDropdown > span").text()} - ${$("#general-area-title").text()}`
    );
    doc.addImage(newCanvasImg, "PNG", 20, 20, 280, 150);
    doc.save(`${$("#general-area-title").text()}.pdf`);
  }

  updateConfig(config, theme) {
    var base = JSON.parse(localStorage.getItem("config"));
    for (var key in config) {
      // if (key == 'includeGradesInAverageChart' && base['includeGradesInAverageChart'] == true) config[key] == false
      base[key] = config[key];
    }
    localStorage.removeItem("config");
    localStorage.setItem("config", JSON.stringify(base));
    this.config = base;
    // if (config['includeGradesInAverageChart']) this.render(this.currentLesson)
    if (config["devMode"] === true) $(".toggle-terminal").show();
    if (config["devMode"] === false) $(".toggle-terminal").hide();
    if ("smiley" in config) {
      setProfilePic();
      if (this.config.smiley)
        this.toast("Profielfoto vervangen met een smiley", 2000, false);
      if (!this.config.smiley)
        this.toast("Profielfoto veranderd naar originele foto", 2000, false);
    }
  }

  setConfig() {
    var config = localStorage.getItem("config") || false;
    if (!config) {
      config = {
        isDesktop: false,
        tention: 0.3,
        passed: 5.5,
        darkTheme: false,
        smiley: false,
        refreshOldGrades: false,
        includeGradesInAverageChart: false,
        devMode: false,
        exclude: []
      };
      localStorage.setItem("config", JSON.stringify(config));
      config = JSON.stringify(config);
    }
    config = JSON.parse(config);
    config["isDesktop"] = $(window).width() > 600 ? true : false;
    this.config = config;
  }

  toast(msg, duration, fullWidth, hardBottom) {
    fullWidth = true;
    var snackId = Math.floor(Math.random() * 1000000 + 1);
    // var bottom = 30
    var bottom = hardBottom
      ? 30
      : $(".snackbar").length < 1
        ? 30
        : $(".snackbar").length * 65 + 30;
    $("body").append(
      `<div id="snackbar-${snackId}" class="snackbar${fullWidth ? " w-90" : ""
      }">${msg}</div>`
    );
    $(`#snackbar-${snackId}`).css(
      "margin-left",
      -($(`#snackbar-${snackId}`).width() / 2 + 16)
    );
    $(`#snackbar-${snackId}`).css("display", "block");
    $(`#snackbar-${snackId}`).animate(
      {
        bottom: `${bottom}px`
      },
      "slow"
    );
    if (duration) {
      setTimeout(function () {
        $(".snackbar").each((i, obj) => {
          if ($(obj).attr("id") != $(`#snackbar-${snackId}`).attr("id")) {
            $(obj).animate(
              {
                bottom: "-=" + $(`#snackbar-${snackId}`).height() * 2
              },
              "fast",
              function () { }
            );
          }
        });
        $(`#snackbar-${snackId}`).animate(
          {
            bottom: "-200px"
          },
          "fast",
          function () {
            $(`#snackbar-${snackId}`).remove();
          }
        );
      }, duration);
    }
    return snackId;
  }

  removeToasts() {
    $(".snackbar").remove();
  }

  initTheme() {
    var theme = this.config.darkTheme;
    var darkThemeDevice = false;
    try {
      darkThemeDevice = cordova.plugins.ThemeDetection.isDarkModeEnabled();
    } catch (e) { }
    // var theme = window.matchMedia('(prefers-color-scheme:dark)').matches;
    var darkThemeDevice = false;
    try {
      if (cordova.plugins.ThemeDetection.isAvailable()) darkThemeDevice = cordova.plugins.ThemeDetection.isDarkModeEnabled().value
    } catch (e) { }
    // if (cordova.platformId == 'android') {
    StatusBar.overlaysWebView(false);
    if (theme || darkThemeDevice) {
      StatusBar.backgroundColorByHexString("#2c2d30");
      StatusBar.styleLightContent();
      $("body").attr("theme", "dark");
    } else {
      StatusBar.backgroundColorByHexString("#ffffff");
      StatusBar.styleDefault();
      $("body").attr("theme", "light");
    }
    // }
  }

  overlay(state) {
    // if (cordova.platformId == 'android') {
    if (state == "show") {
      $("#overlay").show();
      if (this.config.darkTheme)
        StatusBar.backgroundColorByHexString("#161618");
      else StatusBar.backgroundColorByHexString("#7f7f7f");
    }
    if (state == "hide") {
      $("#overlay").hide();
      if (this.config.darkTheme)
        StatusBar.backgroundColorByHexString("#2c2d30");
      else StatusBar.backgroundColorByHexString("#ffffff");
    }
    // }
  }

  toggleTheme() {
    var theme = this.config.darkTheme;
    if (!theme) {
      $("body").attr("theme", "dark");
      this.updateConfig({
        darkTheme: true,
        isDesktop: this.config.isDesktop
      });
    } else {
      $("body").attr("theme", "light");
      this.updateConfig({
        darkTheme: false,
        isDesktop: this.config.isDesktop
      });
    }
  }

  clearExclude() {
    this.closeSettings();
    var count = this.config.exclude.length;
    this.updateConfig({
      exclude: []
    });
    this.currentCourse.course.sortGrades();
    this.renderCourse(this.currentCourse.id, false, false, this.currentLesson);
    this.toast(`Succesvol ${count} cijfers gereset!`, 2000, true);
  }

  lightTheme() {
    // if (cordova.platformId == 'android') {
    window.StatusBar.overlaysWebView(false);
    window.StatusBar.styleDefault();
    window.StatusBar.backgroundColorByHexString("#ffffff");
    // }
    $("body").attr("theme", "light");
    this.updateConfig({
      darkTheme: false,
      isDesktop: this.config.isDesktop
    });
    this.toast("Thema veranderd naar licht", 2000, false);
    logConsole("[INFO]   Theme changed to light");
  }

  darkTheme() {
    // if (cordova.platformId == 'android') {
    window.StatusBar.overlaysWebView(false);
    window.StatusBar.backgroundColorByHexString("#2c2d30");
    window.StatusBar.styleLightContent();
    // }
    $("body").attr("theme", "dark");
    this.updateConfig({
      darkTheme: true,
      isDesktop: this.config.isDesktop
    });
    this.toast("Thema veranderd naar donker", 2000, false);
    logConsole("[INFO]   Theme changed to dark");
  }

  savePassed() {
    var e = parseFloat($("#passed-input").val());
    if (e <= 10 && e >= 1) {
      this.updateConfig({
        passed: e
      });
      this.toast("Voldoendegrens veranderd naar " + e, 2000, false);
      logConsole("[INFO]   Passed changed to " + e);
    } else if (e < 1) {
      this.toast("Vul een getal groter dan 1 in", 3000, false);
    } else if (e > 10) {
      this.toast("Vul een getal kleiner dan 10 in", 3000, false);
    } else {
      this.toast("Ongeldige waarde...", 3000, false);
    }
  }

  giveFeedback() {
    var appId,
      platform = device.platform.toLowerCase();
    switch (platform) {
      case "ios":
        appId = "1529746917";
        break;
      case "android":
        appId = "app.netlob.magiscore";
        break;
    }
    LaunchReview.launch(
      function () { },
      function (err) {
        alert(err);
      },
      appId
    );
  }

  refreshOldGrades() {
    var e = $("#refreshAll-checkbox").prop("checked");
    if (e) {
      navigator.notification.confirm(
        "Als je deze functie aanzet zullen alle wegingen en beschrijvingen van oude cijfers ververst worden. Deze functie staat standaard uit omdat dit bijna nooit meer achteraf veranderd.\nHierdoor wordt de tijd voor een refresh een stuk korter en wordt er minder (mobiele) data verbruikt.\n\nJe kan deze functie tijdelijk aanzetten om alles te updaten nadat een docent een cijfer een andere weging heeft gegeven.\nLet op: de refreshtijd zal aanzienlijk langer worden!",
        confirmRefreshOldGrades,
        "Weet je het zeker?",
        ["Ja", "Nee"]
      );
    } else {
      this.updateConfig({
        refreshOldGrades: false
      });
      this.toast("Oude cijfers resetten uitgezet", 2000, false);
    }
  }

  setLatestGrades(grades, open) {
    var slgrades = grades.slice(0, 5);
    $("#latest-grades")
      .find("*")
      .not("#latest-grades-empty")
      .remove();
    slgrades.forEach(grade => {
      var d = new Date(grade.ingevoerdOp);
      // var w = new Date().getDate() - 7;
      // if (d < w) {
      length++;
      $("#latest-grades").append(`
          <a class="dropdown-item d-flex align-items-center vibrate" onclick="if(viewController.currentCourse == courseController.current()) { viewController.render('${grade.vak.omschrijving.capitalize()}') } else { viewController.renderCourse(courseController.current().course.id, true, false, false) }">
            <div class="dropdown-list-image mr-3">
              <div class="rounded-circle">
                <h3 class="text-center mt-1">${grade.waarde == "10,0"
          ? '<span class="text-success">10</span>'
          : round(grade.waarde) < this.config.passed
            ? '<span class="text-danger">' + grade.waarde + "</span>"
            : grade.waarde
        }<sup style="font-size: 10px !important; position: absolute !important; line-height: 1.2 !important; top: 0px !important; right: -15px !important;">${grade.weegfactor
        }x</sup></h3>
              </div>
              <!-- <div class="status-indicator bg-success"></div> -->
            </div>
            <div class="ml-2">
              <span class="text-truncate font-weight-bold text-capitalize">${grade.vak.omschrijving
        }</span><span
                class="latest-grades-date">${d.getDate()}/${d.getMonth() +
        1}</span></br>
              <div class="small text-gray-600 text-truncate">${grade.omschrijving
        }</div>
            </div>
          </a>
        `);
      // }
    });
    if (grades.length > 5)
      $("#latest-grades-all").text(
        `Alle cijfers (${grades.length} nieuwe cijfers!)`
      );
    if (length == 0) $("#latest-grades-empty").show();
    else $("#latest-grades-empty").hide();
    $("#latest-grades-badge").text(length);
    if (open) {
      $("#messagesDropdownDrop").addClass("show");
      $("#messagesDrop").addClass("show");
      $("#messagesDrop").addClass("open");
      $("#overlay").hide();
    }
  }

  setCourses() {
    $("#years").empty();
    // logConsole(courseController.courses.length)
    courseController.courses.forEach(course => {
      var sexyDate = `${new Date(course.course.start)
        .getFullYear()
        .toString()
        .substring(2)}/${new Date(course.course.end)
          .getFullYear()
          .toString()
          .substring(2)}`;
      // var sexyDate = course.raw.Start
      $("#years").append(
        `<a class="pt-3 pl-4 pb-3 pr-4 dropdown-item vibrate" onclick="viewController.renderCourse('${course.course.id
        }', true, false, false)" id="course-${course.course.id
        }">${sexyDate} - ${course.course.group.description} ${course.course.curricula.length > 0
          ? "(" + course.course.curricula.toString() + ")"
          : ""
        }</a>`
      );
    });
    $("#years")
      .children()
      .removeClass("course-selected");
    $(`#course-${this.currentCourse.course.id}`).addClass("course-selected");
    $("#current-course-badge").text(
      this.currentCourse.course.group.description
    );
    // $(`#course-${this.currentCourse.course.id}`).addClass("course-selected")
  }

  openSettings() {
    $("#buttonSidenavToggle").hide();
    $("#buttonSidenavBack").show();
    $("#general-wrapper").hide();
    $("#topbar").hide();
    $("#lesson-wrapper").hide();
    $("#currentRender").html(
      '<span onclick="viewController.closeSettings()">Instellingen</span>'
    );
    $("#currentRenderMobile").html(
      '<span onclick="viewController.closeSettings()">Instellingen</span>'
    );
    // alert(JSON.stringify(this.config))
    $("#passed-input").attr("placeholder", this.config.passed);
    $("#passed-input").val("");
    $("#devMode-checkbox").prop("checked", this.config.devMode);
    $("#refreshAll-checkbox").prop("checked", this.config.refreshOldGrades);
    $("#excluded-count").text(this.config.exclude.length);
    $("#settings-wrapper").show();
    this.settingsOpen = true;
    this.iddinkInterval = setInterval(() => {
      const date_since = new Date("27 nov 2019");
      const date_now = new Date();

      let seconds = Math.floor((date_since - (date_now)) / 1000);
      let minutes = Math.floor(seconds / 60);
      let hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      hours = hours - (days * 24);
      minutes = minutes - (days * 24 * 60) - (hours * 60);
      seconds = 60 - (seconds - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60));

      $("#kutiddink").text(`${Math.abs(days)} dagen, ${hours} uur, ${minutes} minuten en ${seconds} seconden`);
    }, 1000);
  }

  closeSettings() {
    $("#buttonSidenavToggle").show();
    $("#buttonSidenavBack").hide();
    $("#topbar").show();
    this.render("general");
    this.settingsOpen = false;
    vibrate(15, false);
    clearInterval(this.iddinkInterval);
    // this.render(this.currentLesson.name)
  }

  currentAllGrades() {
    if (this.currentCourse != courseController.current())
      this.renderCourse(
        courseController.current().course.id,
        false,
        false,
        "general"
      );
    $("html, body").animate(
      {
        scrollTop: $("#generalGradesTable").offset().top - 55
      },
      1000
    );
  }
}

function confirmRefreshOldGrades(button) {
  if (button == 1) {
    $("#refreshAll-checkbox").prop("checked", true);
    viewController.updateConfig({
      refreshOldGrades: true
    });
    viewController.toast("Oude cijfers resetten aangezet", 2000, false);
  } else if (button == 2) {
    $("#refreshAll-checkbox").prop("checked", false);
    viewController.updateConfig({
      refreshOldGrades: false
    });
  }
}

function setProfilePic(forceRefresh) {
  if (!forceRefresh) forceRefresh = false;
  // alert(viewController.config.smiley)
  var profilepicStorage = localStorage.getItem("profilepic") || false,
    profilepic = document.getElementById("imgelem");
  if (viewController.config.smiley && !forceRefresh) {
    logConsole("[INFO]   Profile picture as smiley");
    profilepic.setAttribute("src", "./img/smiley.png");
  } else if (profilepicStorage && !forceRefresh) {
    logConsole("[INFO]   Profile picture from localstorage");
    profilepic.setAttribute("src", profilepicStorage);
  } else {
    logConsole("[INFO]   Profile picture from request");
    var xhr = new XMLHttpRequest(),
      blob,
      fileReader = new FileReader();
    xhr.responseType = "blob";
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
        blob = new Blob([xhr.response], {
          type: "image/png"
        });
        fileReader.onload = function (evt) {
          var result = evt.target.result;
          // logConsole(result)
          profilepic.setAttribute("src", result);
          try {
            logConsole("[INFO]   Storage of image success");
            localStorage.setItem("profilepic", result);
            if (forceRefresh)
              viewController.toast("Profielfoto ververst", 2000, false);
          } catch (e) {
            errorConsole("[ERROR] Storage failed: " + e);
            profilepic.setAttribute("src", "./img/smiley.png");
          }
        };
        fileReader.readAsDataURL(blob);
      }
    };
    let url = `https://${school}/api/personen/${person.id}/foto?width=640&height=640&crop=no`;
    if (window.cordova.platformId === "ios") {
      url = 'https://cors.netlob.dev/' + url;
    }
    xhr.open(
      "GET",
      url,
      true
    );
    xhr.setRequestHeader("Authorization", `Bearer ${tokens.access_token}`);
    xhr.send();
  }
}

function updateSidebar() {
  if (lessonController.lessons.length > 0) {
    $("#subjectsNav").empty();
    _.sortBy(lessonController.lessons, ["name"]);
    lessonController.lessons.forEach(lesson =>
      $("#subjectsNav").append(`
        <li class="nav-item vibrate" id="${lesson.name}">
            <a class="nav-link" onclick="viewController.render('${lesson.name
        }')">
                <span>${lesson.name.capitalize()}</span>
            </a>
        </li>
    `)
    );
  } else {
    $("#subjectsNav").html(`
      <li class="text-center mt-4">
            <span class="text-gray-300">Geen cijfers dit jaar...</span>
      </li>`);
  }

  if (viewController.config.devMode) {
    $(".toggle-terminal").show();
  } else {
    $(".toggle-terminal").hide();
  }

  setProfilePic();

  $("#userDropdown > span").text(
    `${person.firstName} ${person.lastName} ${courseController.current().course.group.description
      ? "(" + courseController.current().course.group.description + ")"
      : ""
    }`
  );
  $("#mobilePersonInfo").text(
    `${person.firstName} ${person.lastName} ${courseController.current().course.group.description
      ? "(" + courseController.current().course.group.description + ")"
      : ""
    }`
  );
  // var header = document.getElementById("accordionSidebar");
  // var btns = header.getElementsByClassName("nav-item");
  // for (var i = 0; i < btns.length; i++) {
  //   btns[i].addEventListener("click", function () {
  //     $("body").removeClass("sidenav-open")
  //     /*if ($(window).width() <= 465)*/
  //     snapper.close()
  //     var current = $(".active");
  //     if (current.length > 0) {
  //       current[0].className = current[0].className.replace(" active", "");
  //     }
  //     this.className += " active";
  //   });
  // }
}

function setChartData(config, lesson, everything) {
  // this.lineChart.clear()
  this.lineChart = "";
  this.lineChart2 = "";
  this.pieChart = "";
  this.generalBarChart = "";
  this.barChart = "";
  var data = [];
  var datums = [];
  var cijfers = [];
  var wegingen = [];
  var gemiddeldes = [];
  var afgerond = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  var vol = 0;
  var onvol = 0;
  if (lesson == "general") {
    lessonController.lessons.forEach(lesson => {
      if (lesson.lesson.grades.length > 0) {
        lesson.lesson.grades.forEach(grade => {
          if (!grade.exclude) {
            var gradegrade = grade.grade.replace(",", ".");
            data.push({
              t: new Date(grade.dateFilledIn),
              y: gradegrade,
              a: grade.average,
              w: grade.weight
            });
            gradegrade = parseFloat(gradegrade.replace(",", "."));
            if (grade.passed) {
              vol++;
            } else {
              onvol++;
            }
          }
        });
      }
    });
  } else {
    lessonController.getLesson(lesson).lesson.grades.forEach(grade => {
      if (!grade.exclude) {
        var gradegrade = grade.grade.replace(",", ".");
        data.push({
          t: new Date(grade.dateFilledIn),
          y: gradegrade,
          a: grade.average,
          w: grade.weight
        });
        gradegrade = parseFloat(gradegrade.replace(",", "."));
        if (gradegrade >= 5.5) {
          vol++;
        } else {
          onvol++;
        }
      }
    });
  }

  data.sort(function (a, b) {
    return new Date(b.t) - new Date(a.t);
  });

  data.forEach(value => {
    //   datums.push(`${value.t.getMonth()+1}/${value.t.getFullYear().toString().substr(-2)}`)
    datums.push(toShortFormat(value.t));
    cijfers.push(value.y);
    gemiddeldes.push(Math.round(value.a.value * 100) / 100);
    wegingen.push(value.w);
    switch (Math.round(value.y)) {
      case 1:
        afgerond[0]++;
        break;
      case 2:
        afgerond[1]++;
        break;
      case 3:
        afgerond[2]++;
        break;
      case 4:
        afgerond[3]++;
        break;
      case 5:
        afgerond[4]++;
        break;
      case 6:
        afgerond[5]++;
        break;
      case 7:
        afgerond[6]++;
        break;
      case 8:
        afgerond[7]++;
        break;
      case 9:
        afgerond[8]++;
        break;
      case 10:
        afgerond[9]++;
        break;
    }
  });

  datums.reverse();
  cijfers.reverse();
  wegingen.reverse();
  gemiddeldes.reverse();

  if (cijfers.length == 1)
    datums.push(datums[0]),
      cijfers.push(cijfers[0]),
      gemiddeldes.push(gemiddeldes[0]);

  // if (viewController.lineChart != false) viewController.lineChart.destroy();
  var ctx = document.getElementById("lineChart").getContext("2d");
  viewController.lineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: datums,
      // labels: ["Sep", "Okt", "Nov", "Dec", "Jan", "Feb", "Maa", "Apr", "Mei", "Jun", "Jul"],
      datasets: [
        {
          label: "Cijfer",
          lineTension: config.tention,
          backgroundColor: "rgba(0, 150, 219, 0.06)",
          borderColor: "rgba(38, 186, 255, 1)",
          pointRadius: 2,
          pointBackgroundColor: "rgba(0, 150, 219, 1)",
          pointBorderColor: "rgba(0, 150, 219, 1)",
          pointHoverRadius: 4,
          pointHoverBackgroundColor: "rgba(0, 150, 219, 1)",
          pointHoverBorderColor: "rgba(0, 150, 219, 1)",
          pointHitRadius: 30,
          pointBorderWidth: 2,
          borderWidth: config.isDesktop ? 3 : 1.5,
          data: cijfers
          // pointRadius: 1
        } //,
        // {
        //   label: "Weging",
        //   lineTension: config.tention,
        //   backgroundColor: "rgba(0, 150, 219, 0)",
        //   borderColor: "rgba(38, 186, 255, 0)",
        //   pointRadius: 0,
        //   pointBackgroundColor: "rgba(0, 150, 219, 0)",
        //   pointBorderColor: "rgba(0, 150, 219, 0)",
        //   pointHoverRadius: 0,
        //   pointHoverBackgroundColor: "rgba(0, 150, 219, 0)",
        //   pointHoverBorderColor: "rgba(0, 150, 219, 0)",
        //   pointHitRadius: 0,
        //   pointBorderWidth: 0,
        //   borderWidth: 0,
        //   data: wegingen,
        //   pointRadius: 0
        // }
      ]
    },
    options: {
      defaultFontFamily: '"Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      maintainAspectRatio: false,
      responsive: true,
      layout: {
        padding: {
          //   left: 10,
          //   right: 25,
          //   top: 25,
          //   bottom: 0
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      },
      scales: {
        xAxes: [
          {
            time: {
              unit: "month",
              displayFormats: {
                quarter: "ll"
              }
            },
            gridLines: {
              display: false,
              drawBorder: false
            },
            ticks: {
              maxTicksLimit: 4,
              autoSkip: true,
              maxRotation: 0,
              minRotation: 0
            },
            // type: 'time',
            distribution: "linear",
            display: config.isDesktop
          }
        ],
        yAxes: [
          {
            ticks: {
              maxTicksLimit: 1,
              padding: 5,
              beginAtZero: false,
              stepSize: 1,
              steps: 1,
              max: 10,
              min: 1,
              display: true //config.isDesktop
            }
            // gridLines: {
            //     color: "rgb(234, 236, 244)",
            //     zeroLineColor: "rgb(234, 236, 244)",
            //     drawBorder: false,
            //     borderDash: [2],
            //     zeroLineBorderDash: [2]
            // }
          }
        ]
      },
      legend: {
        display: false
      },
      tooltips: {
        backgroundColor: "#0096db",
        // bodyFontColor: "#858796",
        titleMarginBottom: 2,
        // titleFontColor: "#6e707e",
        titleFontSize: 12,
        bodyFontSize: 12,
        borderColor: "rgba(0, 150, 219, 1)",
        borderWidth: 1,
        xPadding: 8,
        yPadding: 8,
        displayColors: false,
        intersect: true,
        mode: "index",
        caretPadding: 4
      },
      annotation: {
        annotations: [
          {
            type: "line",
            mode: "horizontal",
            scaleID: "y-axis-0",
            value: config.passed,
            borderColor: "rgb(232, 100, 88)",
            borderWidth: 1,
            label: {
              enabled: false,
              content: "Onvoldoende"
            }
          }
        ]
      }
    }
  });

  // if (viewController.pieChart != false) viewController.pieChart.destroy();
  var ctx = document.getElementById("pieChart");
  viewController.pieChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Voldoendes", "Onvoldoendes"],
      datasets: [
        {
          data: [vol, onvol],
          backgroundColor: [
            "rgba(0, 150, 219, 0.2)",
            "rgba(232, 100, 88, 0.2)"
          ],
          hoverBackgroundColor: [
            "rgba(0, 150, 219, 0.4)",
            "rgba(232, 100, 88, 0.4)"
          ],
          hoverBorderColor: ["#0096db", "#e86458"],
          borderColor: ["#0096db", "#e86458"] //config.darkTheme ? "#2c2d30" : "#fff"
        }
      ]
    },
    options: {
      defaultFontFamily: '"Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      maintainAspectRatio: false,
      tooltips: {
        backgroundColor: "rgba(0, 150, 219, 1)",
        titleMarginBottom: 2,
        titleFontSize: 12,
        bodyFontSize: 12,
        borderColor: "rgba(0, 150, 219, 1)",
        borderWidth: 1,
        xPadding: 8,
        yPadding: 8,
        displayColors: false,
        intersect: false,
        mode: "index",
        caretPadding: 4
      },
      legend: {
        display: false
      },
      cutoutPercentage: 80
    }
  });

  if (vol + onvol > 0) {
    var tot = vol + onvol;
    vol = round((vol / tot) * 100);
    onvol = round((onvol / tot) * 100);
    $("#percentageGrades").text(`${vol}% voldoende - ${onvol}% onvoldoende`);
  } else {
    $("#percentageGrades").text(`Geen cijfers voor dit vak...`);
  }

  // if (viewController.lineChart2 != false) viewController.lineChart2.update();
  if (lesson != "general") {
    var ctx = document.getElementById("lineChart2").getContext("2d");
    var data = [
      {
        label: "Gemiddelde",
        lineTension: config.tention,
        backgroundColor: "rgba(0, 150, 219, 0.06)",
        borderColor: "rgba(38, 186, 255, 1)",
        pointRadius: 2,
        pointBackgroundColor: "rgba(0, 150, 219, 1)",
        pointBorderColor: "rgba(0, 150, 219, 1)",
        pointHoverRadius: 4,
        pointHoverBackgroundColor: "rgba(0, 150, 219, 1)",
        pointHoverBorderColor: "rgba(0, 150, 219, 1)",
        pointHitRadius: 30,
        pointBorderWidth: 2,
        borderWidth: config.isDesktop ? 3 : 1.5,
        data: gemiddeldes
        // pointRadius: 1
      } //,
      // {
      //   label: "Weging",
      //   lineTension: config.tention,
      //   backgroundColor: "rgba(0, 150, 219, 0)",
      //   borderColor: "rgba(38, 186, 255, 0)",
      //   pointRadius: 0,
      //   pointBackgroundColor: "rgba(0, 150, 219, 0)",
      //   pointBorderColor: "rgba(0, 150, 219, 0)",
      //   pointHoverRadius: 0,
      //   pointHoverBackgroundColor: "rgba(0, 150, 219, 0)",
      //   pointHoverBorderColor: "rgba(0, 150, 219, 0)",
      //   pointHitRadius: 0,
      //   pointBorderWidth: 0,
      //   borderWidth: 0,
      //   data: wegingen,
      //   pointRadius: 0
      // }
    ];
    // if (config.includeGradesInAverageChart) {
    if (true) {
      data.push({
        label: "Cijfer",
        lineTension: config.tention,
        backgroundColor: "rgba(0, 219, 69, 0.06)",
        borderColor: "rgba(0, 252, 80, 1)",
        pointRadius: 2,
        pointBackgroundColor: "rgba(0, 219, 69, 1)",
        pointBorderColor: "rgba(0, 219, 69, 1)",
        pointHoverRadius: 4,
        pointHoverBackgroundColor: "rgba(0, 219, 69, 1)",
        pointHoverBorderColor: "rgba(0, 219, 69, 1)",
        pointHitRadius: 30,
        pointBorderWidth: 2,
        borderWidth: config.isDesktop ? 3 : 1.5,
        data: cijfers
        // pointRadius: 1
      });
    }
    viewController.lineChart2 = new Chart(ctx, {
      type: "line",
      data: {
        labels: datums,
        // labels: ["Sep", "Okt", "Nov", "Dec", "Jan", "Feb", "Maa", "Apr", "Mei", "Jun", "Jul"],
        datasets: data
      },
      options: {
        defaultFontFamily: '"Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        maintainAspectRatio: false,
        responsive: true,
        layout: {
          padding: {
            //   left: 10,
            //   right: 25,
            //   top: 25,
            //   bottom: 0
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
          }
        },
        scales: {
          xAxes: [
            {
              time: {
                unit: "month",
                displayFormats: {
                  quarter: "ll"
                }
              },
              gridLines: {
                display: false,
                drawBorder: false
              },
              ticks: {
                maxTicksLimit: 4,
                autoSkip: true,
                maxRotation: 0,
                minRotation: 0
              },
              // type: 'time',
              distribution: "linear",
              display: config.isDesktop
            }
          ],
          yAxes: [
            {
              ticks: {
                maxTicksLimit: 1,
                padding: 5,
                beginAtZero: false,
                stepSize: 1,
                steps: 1,
                max: 10,
                min: 1,
                display: true //config.isDesktop
              }
              // gridLines: {
              //     color: "rgb(234, 236, 244)",
              //     zeroLineColor: "rgb(234, 236, 244)",
              //     drawBorder: false,
              //     borderDash: [2],
              //     zeroLineBorderDash: [2]
              // }
            }
          ]
        },
        legend: {
          display: true,
          position: "bottom",
          labels: {
            fontSize: 15,
            boxWidth: 50
          }
          // onClick: navigator.vibrate(15, false)
        },
        tooltips: {
          backgroundColor: "#0096db",
          // bodyFontColor: "#858796",
          titleMarginBottom: 2,
          // titleFontColor: "#6e707e",
          titleFontSize: 12,
          bodyFontSize: 12,
          borderColor: "rgba(0, 150, 219, 1)",
          borderWidth: 1,
          xPadding: 8,
          yPadding: 8,
          displayColors: false,
          intersect: true,
          mode: "index",
          caretPadding: 4
        },
        annotation: {
          annotations: [
            {
              type: "line",
              mode: "horizontal",
              scaleID: "y-axis-0",
              value: config.passed,
              borderColor: "rgb(232, 100, 88)",
              borderWidth: 1,
              label: {
                enabled: false,
                content: "Onvoldoende"
              }
            }
          ]
        }
      }
    });
  } else {
    let vakken = []
    let vaknamen = []
    let bgcolors = []
    let bcolors = []

    lessonController.lessons.forEach(lesson => {
      let grademap = lesson.lesson.grades.map(grade => {
        if (!grade.exclude) {
          var gradegrade = grade.grade.replace(",", ".");
          gradegrade = parseFloat(gradegrade.replace(",", "."));
          return [isNaN(gradegrade), grade]
        }
      });
      grademap = grademap.filter(a => a[0] == false);
      if (lesson.lesson.grades.length > 0 && grademap.length > 0) {
        const abb = grademap[0][1].class.abbreviation;
        var avg = lesson.lesson.getAverage(true);
        if (!isNaN(avg) && avg > 1) {
          vaknamen.push(abb);
          vakken.push(avg);
          bgcolors.push(avg > config.passed ? "rgba(0,255,0,0.2)" : "rgba(255,0,0,0.2)");
          bcolors.push(avg > config.passed ? "rgba(0,255,0,1)" : "rgba(255,0,0,1)");
        }
      }
    });
    viewController.generalBarChart = new Chart(document.getElementById("generalBarChart"), {
      type: "bar",
      data: {
        labels: vaknamen,
        datasets: [
          {
            label: "Gemiddelde",
            data: vakken,
            fill: false,
            backgroundColor: bgcolors,
            borderColor: bcolors,
            borderWidth: 1
          }
        ]
      },
      options: {
        defaultFontFamily: '"Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        scales: {
          yAxes: [
            {
              ticks: {
                maxTicksLimit: 10,
                beginAtZero: true,
                steps: 1
              }
            }
          ]
        },
        maintainAspectRatio: false,
        responsive: true,
        layout: {
          padding: {
            //   left: 10,
            //   right: 25,
            //   top: 25,
            //   bottom: 0
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
          },
        },
        legend: {
          display: false
        },
        tooltips: {
          backgroundColor: "#0096db",
          // bodyFontColor: "#858796",
          titleMarginBottom: 2,
          // titleFontColor: "#6e707e",
          titleFontSize: 12,
          bodyFontSize: 12,
          borderColor: "rgba(0, 150, 219, 1)",
          borderWidth: 1,
          xPadding: 8,
          yPadding: 8,
          displayColors: false,
          intersect: true,
          mode: "index",
          caretPadding: 4,
          enabled: false
        },
        animation: {
          duration: 0,
          onComplete: function () {
            var chartInstance = this.chart,
              ctx = chartInstance.ctx;

            ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontSize, Chart.defaults.global.defaultFontStyle, Chart.defaults.global.defaultFontFamily);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';

            this.data.datasets.forEach(function (dataset, i) {
              var meta = chartInstance.controller.getDatasetMeta(i);
              meta.data.forEach(function (bar, index) {
                var data = Math.round(parseFloat(dataset.data[index]) * 10) / 10;
                ctx.fillStyle = "#6e707e";
                ctx.fillText(data, bar._model.x, bar._model.y + 15);
              });
            });
          }
        },
      }
    });
  }

  // $("#barChart-container").empty().append(`<canvas id="barChart""></canvas>`)
  viewController.barChart = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      datasets: [
        {
          label: "Behaalde afgeronde cijfers",
          data: afgerond,
          fill: false,
          backgroundColor: [
            "rgba(255,0,0,0.2)",
            "rgba(255,35,0,0.2)",
            "rgba(255,87,0,0.2)",
            "rgba(255,140,0,0.2)",
            "rgba(255,193,0,0.2)",
            "rgba(255,246,0,0.2)",
            "rgba(212,255,0,0.2)",
            "rgba(159,255,0,0.2)",
            "rgba(106,255,0,0.2)",
            "rgba(53,255,0,0.2)",
            "rgba(0,255,0,0.2)"
          ],
          borderColor: [
            "rgba(255,0,0,1)",
            "rgba(255,35,0,1)",
            "rgba(255,87,0,1)",
            "rgba(255,140,0,1)",
            "rgba(255,193,0,1)",
            "rgba(255,246,0,1)",
            "rgba(212,255,0,1)",
            "rgba(159,255,0,1)",
            "rgba(106,255,0,1)",
            "rgba(53,255,0,1)",
            "rgba(0,255,0,1)"
          ],
          borderWidth: 1
        }
      ]
    },
    options: {
      defaultFontFamily: '"Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      scales: {
        yAxes: [
          {
            ticks: {
              maxTicksLimit: 10,
              beginAtZero: true,
              steps: 1
            }
          }
        ]
      },
      maintainAspectRatio: false,
      responsive: true,
      layout: {
        padding: {
          //   left: 10,
          //   right: 25,
          //   top: 25,
          //   bottom: 0
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      },
      legend: {
        display: false
      },
      tooltips: {
        backgroundColor: "#0096db",
        // bodyFontColor: "#858796",
        titleMarginBottom: 2,
        // titleFontColor: "#6e707e",
        titleFontSize: 12,
        bodyFontSize: 12,
        borderColor: "rgba(0, 150, 219, 1)",
        borderWidth: 1,
        xPadding: 8,
        yPadding: 8,
        displayColors: false,
        intersect: true,
        mode: "index",
        caretPadding: 4
      }
    }
  });
}

function setAllGrades() { }

function toShortFormat(d) {
  d = new Date(d);
  var month_names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Okt",
    "Nov",
    "Dec"
  ];
  var day = d.getDate();
  var month_index = d.getMonth();
  var year = d.getFullYear();
  return "" + day + " " + month_names[month_index] + " " + year;
}

function setTableData(lesson) {
  var lesson, table, grades;
  if (lesson == "general") {
    grades = viewController.currentCourse.course.grades;
    table = $("#generalGradesTable");
  } else {
    lesson = lessonController.getLesson(lesson).lesson;
    table = $("#cijfersTable");
    grades = lesson.grades;
  }
  _.sortBy(grades, ["dateFilledIn", "description", "weight"]);
  table.empty();
  if (grades.length == 0) {
    table
      .empty()
      .append(
        `<h6 class="percentageGrades text-center">${(lesson = "general"
          ? "Je hebt nog geen cijfers dit jaar"
          : "Geen cijfers voor dit vak")}...</h6>`
      );
    return;
  }
  // $("#dataTable").show()
  grades.reverse();
  grades.forEach((grade, index) => {
    if (
      grade.type._type == 1 &&
      round(grade.grade) > 0 &&
      round(grade.grade) < 11
    ) {
      var d = new Date(grade.dateFilledIn);
      table.append(`
        <a class="d-flex align-items-center border-bottom vibrate grade-card" href="#" data-toggle="modal" data-target="#gradeModal" onclick="viewController.renderGrade(${grade.id
        })" ${grade.exclude ? 'style="opacity:0.5 !important;"' : ""}>
          <div class="dropdown-list-image mr-1" style="margin-bottom: -9px">
            <div class="rounded-circle">
              <h4 class="text-center mt-2">${grade.grade == "10,0"
          ? '<span class="text-success">10</span><span class="invisible">,</span>'
          : !grade.passed
            ? '<span class="text-danger">' + grade.grade + "</span>"
            : grade.grade
        }<sup class="text-gray-800" style="font-size: 10px !important; top: -2em !important; font-variant-numeric: tabular-nums !important;">${grade.weight < 10
          ? grade.weight + 'x<span class="invisible">0</span>'
          : grade.weight + "x"
        }</sup></h4>
            </div>
            <!-- <div class="status-indicator bg-success"></div> -->
          </div>
          <div class="ml-1" style="padding-top: -6px">
            <span class="text-truncate font-weight-bold text-gray-800 small grade-small text-capitalize">${(lesson = "general"
          ? grade.class.description
          : grade.description)}</span>
            <span
              class="grades-table-date small grade-small float-right text-gray-600">${d.getDate()}-${d.getMonth() +
        1}-${d.getFullYear()}</span>
            <div class="small grade-small text-gray-600">${grade.description == ""
          ? "<i>Geen beschrijving...</i>"
          : grade.description
        }</div>
          </div>
        </a>
        ${index != grades.length - 1 ? '<hr class="m-0 p-0">' : ""}
      `);
    }
  });
  // $('#dataTable').DataTable();
}

function setAverages() {
  var totcompleted = 0,
    totcomclass = 0,
    totgem = 0,
    totgemclass = 0;
  $("#general-progress").empty();
  $("#averagesTable").empty();
  lessonController.lessons.forEach(lesson => {
    var average = lesson.lesson.getAverage();
    if (parseFloat(average) > -1 && parseFloat(average) < 11) {
      $("#averagesTable").append(
        `<tr onclick="viewController.render('${lesson.name}')">
          <td>${lesson.name}</td>
          <td>${Math.round(average * 100) / 100}</td>
         </tr>`
      );
      totgem = totgem + parseFloat(average);
      totgemclass++;
    }
  });
  var totgem = totgem / totgemclass;
  $("#general-average").text(
    `${round(totgem) == "NaN" ? "Geen cijfers..." : round(totgem)}`
  );
}

function generateProgressHTML(lesson) {
  // var completed = lessonController.getLesson(lesson).lesson.getCompleted()
  // return `<div>
  //             <h4 class="small font-weight-bold">${lesson}<span class="float-right">${completed}%</span></h4>
  //             <div class="progress mb-4">
  //             <div class="progress-bar" role="progressbar" style="width: ${completed}%;" aria-valuenow="${completed}" aria-valuemin="0" aria-valuemax="100"></div>
  //             </div>
  //         </div>`
  return;
}

function generateHTML(lesson) {
  var lesson = lessonController.getLesson(lesson).lesson;
  var extraFirst = lesson.getFirst();
  var average = lesson.getAverage(true);
  var extraSecond = "nee."; //lesson.getSecond();
  var extraThird = "nee."; //lesson.getThird();
  var facts = lesson.getDays();
  return `<!-- Page Heading -->
            <!-- <div class="d-sm-flex align-items-center justify-content-between mb-4">
            <h1 class="h3 mb-0 text-gray-800">${lesson.name.capitalize()}</h1>
            </div> -->
            <!-- Content Row -->
            <div class="row">
            <!-- Earnings (Monthly) Card Example -->
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-primary shadow h-100 py-2">
                <div class="card-body">
                    <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-primary-blue text-uppercase mb-1">Gemiddeld cijfer</div>
                        <div class="h5 mb-0 font-weight-bold text-gray-800">${average}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-graduation-cap fa-2x text-gray-300"></i>
                    </div>
                    </div>
                </div>
                </div>
            </div>

            <!-- <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-success shadow h-100 py-2">
                  <div class="card-body">
                      <div class="row no-gutters align-items-center">
                      <div class="col mr-2">
                          <div class="text-xs font-weight-bold text-success text-uppercase mb-1 text-green">${""}</div>
                          <div class="row no-gutters align-items-center">
                          <div class="col-auto">
                              <div class="h5 mb-0 mr-3 font-weight-bold text-gray-800">${""}</div>
                          </div>
                          </div>
                      </div>
                      <div class="col-auto">
                          <i class="fas fa-spinner fa-2x text-gray-300"></i>
                      </div>
                      </div>
                  </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-info shadow h-100 py-2">
                <div class="card-body">
                    <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-info text-uppercase mb-1">${""}</div>
                        <div class="row no-gutters align-items-center">
                        <div class="col-auto">
                            <div class="h5 mb-0 mr-3 font-weight-bold text-gray-800">${""}</div>
                        </div>
                        </div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-check fa-2x text-gray-300"></i>
                    </div>
                    </div>
                </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-warning shadow h-100 py-2">
                <div class="card-body">
                    <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">${""}</div>
                        <div class="h5 mb-0 font-weight-bold text-gray-800">${""}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-grin-beam-sweat fa-2x text-gray-300"></i>
                    </div>
                    </div>
                </div>
                </div>
            </div> -->
            </div>

            <div class="row">
              <div class="col-xl-8 col-lg-7">
                  <div class="card shadow mb-4">
                  <!-- Card Header - Dropdown -->
                  <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                      <h6 class="m-0 font-weight-bold text-primary">Gemiddelde van ${lesson.name
    }</h6>
                      <!--<div class="dropdown no-arrow">
                        <a class="dropdown-toggle" href="#" role="button" id="dropdownMenuLink" data-toggle="dropdown" aria-label="Uitschuiven" aria-haspopup="true" aria-expanded="false">
                            <i class="fas fa-ellipsis-v fa-sm fa-fw text-gray-400"></i>
                        </a>
                        <div class="dropdown-menu dropdown-menu-right shadow animated--fade-in" aria-labelledby="dropdownMenuLink">
                            <div class="dropdown-header">Grafiek instellingen:</div>
                            <a class="dropdown-item" href="#" onclick="viewController.updateConfig({'includeGradesInAverageChart': true})">Laat bijbehorende cijfers zien</a>
                        </div>
                      </div>-->
                  </div>
                  <!-- Card Body -->
                  <div class="card-body pt-0 chart-card">
                      <div class="chart-area chart-container lineChart2-container-lesson">
                        <canvas id="lineChart2"></canvas>
                      </div>
                  </div>
                  </div>
              </div>

                <div class="col-lg-6 mb-4">
                    <div class="card text-gray-800 shadow">
                        <div class="card-body">
                            Wat ga ik staan?
                            <div class="newGrade-wrapper">
                            <form class="newGrade">
                                <p></p>
                                <div class="form-group">
                                    <input type="number" class="form-control form-control-user" id="newGrade-grade" min="1" max="10" placeholder="Nieuw cijfer">
                                </div>
                                <div class="form-group">
                                    <input type="number" class="form-control form-control-user" id="newGrade-weight" min="0" placeholder="Weging">
                                </div>
                            <a onclick="lessonController.getLesson('${lesson.name
    }').lesson.getNewAverage()" class="btn btn-primary btn-user btn-block bg-gradiant-primary">Berekenen</a>
                            </form>
                            <div class="showCalculatedGrade">
                                <h1 id="newGrade-newGrade"><i class="fas fa-chart-line fa-sm text-primary"></i></h1>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 mb-4">
                    <div class="card text-gray-800 shadow">
                        <div class="card-body">
                            Wat moet ik halen?
                            <div class="newGrade-wrapper">
                            <form class="getGrade">
                                <p></p>
                                <div class="form-group">
                                    <input type="number" class="form-control form-control-user" id="getGrade-grade" min="1" max="10" placeholder="Wat ik wil staan">
                                </div>
                                <div class="form-group">
                                    <input type="number" class="form-control form-control-user" id="getGrade-weight" min="0" placeholder="Weging">
                                </div>
                                <a onclick="lessonController.getLesson('${lesson.name
    }').lesson.needToGet()" class="btn btn-primary btn-user btn-block bg-gradiant-primary">Berekenen</a>
                            </form>
                            <div class="showCalculatedGrade">
                              <h1 id="getGrade-newGrade"><i class="fas fa-chart-line fa-sm text-primary"></i></h1>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content Row -->

            <div class="row">

            <div class="col-xl-8 col-lg-7">
                <div class="card shadow mb-4">
                <!-- Card Header - Dropdown -->
                <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                    <h6 class="m-0 font-weight-bold text-primary">Cijfers voor ${lesson.name
    }</h6>
                </div>
                <!-- Card Body -->
                <div class="card-body pt-0 chart-card">
                    <div class="chart-area chart-container lineChart-container-lesson">
                      <canvas id="lineChart"></canvas>
                    </div>
                </div>
                </div>
            </div>

              <div class="col-xl-4 col-lg-5">
                  <div class="card shadow mb-4">
                  <!-- Card Header - Dropdown -->
                  <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                      <h6 class="m-0 font-weight-bold text-primary">Voldoendes / onvoldoendes</h6>
                      <!--<div class="dropdown no-arrow">
                        <a class="dropdown-toggle" href="#" role="button" id="dropdownMenuLink" data-toggle="dropdown" aria-label="Download grafiek" aria-haspopup="true" aria-expanded="false">
                            <i class="fas fa-ellipsis-v fa-sm fa-fw text-gray-400"></i>
                        </a>
                        <div class="dropdown-menu dropdown-menu-right shadow animated--fade-in" aria-labelledby="dropdownMenuLink">
                            <div class="dropdown-header">Dropdown Header:</div>
                            <a class="dropdown-item" href="#">Action</a>
                            <a class="dropdown-item" href="#">Another action</a>
                            <div class="dropdown-divider"></div>
                            <a class="dropdown-item" href="#">Something else here</a>
                        </div>
                      </div> -->
                  </div>
                  <!-- Card Body -->
                  <div class="card-body">
                      <h6 id="percentageGrades"></h6>
                      <div class="chart-pie chart-container pt-4 pb-2 pieChart-container-lesson">
                        <canvas id="pieChart"></canvas>
                      </div>
                      <div class="text-center small">
                        <span class="mr-2">
                            <i class="fas fa-circle" style="color: #0096db"></i> Voldoendes
                        </span>
                        <span class="mr-2">
                            <i class="fas fa-circle" style="color: #e86458"></i> Onvoldoendes
                        </span>
                      </div>
                  </div>
                  </div>
              </div>

              <div class="col-xl-4 col-lg-5">
                  <div class="card shadow mb-4">
                  <!-- Card Header - Dropdown -->
                  <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                      <h6 class="m-0 font-weight-bold text-primary">Behaalde afgeronde cijfers</h6>
                      <!--<div class="dropdown no-arrow">
                        <a class="dropdown-toggle" href="#" role="button" id="dropdownMenuLink" data-toggle="dropdown" aria-label="Download grafiek" aria-haspopup="true" aria-expanded="false">
                            <i class="fas fa-ellipsis-v fa-sm fa-fw text-gray-400"></i>
                        </a>
                        <div class="dropdown-menu dropdown-menu-right shadow animated--fade-in" aria-labelledby="dropdownMenuLink">
                            <div class="dropdown-header">Dropdown Header:</div>
                            <a class="dropdown-item" href="#">Action</a>
                            <a class="dropdown-item" href="#">Another action</a>
                            <div class="dropdown-divider"></div>
                            <a class="dropdown-item" href="#">Something else here</a>
                        </div>
                      </div> -->
                  </div>
                  <!-- Card Body -->
                  <div class="card-body pt-0">
                      <div class="chart-bar chart-container pt-4 pb-2 barChart-container-lesson">
                      <canvas id="barChart"></canvas>
                      </div>
                  </div>
                  </div>
              </div>
            </div>

            <div class="row">
              <div class="col-lg-4">
                <div class="card shadow mb-4">
                  <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Feiten voor ${lesson.name
    }</h6>
                  </div>
                  <div class="card-body pt-0">
                    <p class="font-weight-bold mb-0 pb-0">Meeste cijfers achter elkaar</p>
                    <span class="mb-0 pb-0 mt-0 pt-0">${facts["passed"]["days"]
    } ${facts["passed"]["days"] == 1
      ? "dag voldoende"
      : "dagen voldoendes achter elkaar"
    }<br>
                    <span class="small grade-small mt-0 pt-0">${facts["passed"]["start"]
    } tot ${facts["passed"]["end"]} (${facts["passed"]["grades"]
    } ${facts["not_passed"]["grades"] == 1 ? "cijfer" : "cijfers"})</span></span>
                    <br>
                    <span class="mb-0 pb-0">${facts["not_passed"]["days"]} ${facts["not_passed"]["days"] == 1
      ? "dag onvoldoende"
      : "dagen onvoldoendes achter elkaar"
    }<br>
                    <span class="small grade-small mt-0 pt-0">${facts["not_passed"]["start"]
    } tot ${facts["not_passed"]["end"]} (${facts["not_passed"]["grades"]
    } ${facts["not_passed"]["grades"] == 1 ? "cijfer" : "cijfers"})</span></span>
                    ${lesson.lastYearGroup == undefined ||
      lesson.lastYearAverage == undefined
      ? ""
      : `
                    <hr>
                    <p class="font-weight-bold mb-0 pb-0">Gemiddelde vorig jaar voor dit vak</p>
                    In klas ${lesson.lastYearGroup.description} stond je een ${lesson.lastYearAverage} voor dit vak`
    }
                  </div>
                </div>
              </div>

              <div class="col-xl-8">
                <!-- DataTales Example -->
                <div class="card shadow mb-4">
                    <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Cijfers voor ${lesson.name
    }</h6>
                    </div>
                    <div class="card-body pt-0">
                      <div id="cijfersTable">
                      </div>
                      <!--<div class="table-responsive" id="cijfersTableCard">
                        <table class="table" id="dataTable" width="100%" cellspacing="0" data-snap-ignore="true">
                          <thead class="text-primary">
                              <tr>
                              <th></th>
                              <th>Cijfer</th>
                              <th>Weging</th>
                              <th>Omschrijving</th>
                              <th>Telt mee</th>
                              <th>Is voldoende</th>
                              <th>Is PTA</th>
                              <th>Inhalen</th>
                              <th>Vrijstelling</th>
                              <th>Docent</th>
                              <th>Ingevoerd op</th>
                              </tr>
                          </thead>
                          <tbody id="cijfersTable">
                          </tbody>
                        </table>
                      </div> -->
                    </div>
                </div>
              </div>
            </div>`;

  // <!-- Content Row -->
  // <div class="row">

  //   <!-- Content Column -->
  //   <div class="col-lg-6 mb-4">

  //     <!-- Project Card Example -->
  //     <div class="card shadow mb-4">
  //       <div class="card-header py-3">
  //         <h6 class="m-0 font-weight-bold text-primary">Projects</h6>
  //       </div>
  //       <div class="card-body">
  //         <h4 class="small font-weight-bold">Server Migration <span class="float-right">20%</span></h4>
  //         <div class="progress mb-4">
  //           <div class="progress-bar bg-danger" role="progressbar" style="width: 20%" aria-valuenow="20" aria-valuemin="0" aria-valuemax="100"></div>
  //         </div>
  //         <h4 class="small font-weight-bold">Sales Tracking <span class="float-right">40%</span></h4>
  //         <div class="progress mb-4">
  //           <div class="progress-bar bg-warning" role="progressbar" style="width: 40%" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100"></div>
  //         </div>
  //         <h4 class="small font-weight-bold">Customer Database <span class="float-right">60%</span></h4>
  //         <div class="progress mb-4">
  //           <div class="progress-bar" role="progressbar" style="width: 60%" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"></div>
  //         </div>
  //         <h4 class="small font-weight-bold">Payout Details <span class="float-right">80%</span></h4>
  //         <div class="progress mb-4">
  //           <div class="progress-bar bg-info" role="progressbar" style="width: 80%" aria-valuenow="80" aria-valuemin="0" aria-valuemax="100"></div>
  //         </div>
  //         <h4 class="small font-weight-bold">Account Setup <span class="float-right">Complete!</span></h4>
  //         <div class="progress">
  //           <div class="progress-bar bg-success" role="progressbar" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
  //         </div>
  //       </div>
  //     </div>

  //     <!-- Color System -->
  //     <div class="row">
  //       <div class="col-lg-6 mb-4">
  //         <div class="card bg-primary text-white shadow">
  //           <div class="card-body">
  //             Primary
  //             <div class="text-white-50 small">#4e73df</div>
  //           </div>
  //         </div>
  //       </div>
  //       <div class="col-lg-6 mb-4">
  //         <div class="card bg-success text-white shadow">
  //           <div class="card-body">
  //             Success
  //             <div class="text-white-50 small">#1cc88a</div>
  //           </div>
  //         </div>
  //       </div>
  //       <div class="col-lg-6 mb-4">
  //         <div class="card bg-info text-white shadow">
  //           <div class="card-body">
  //             Info
  //             <div class="text-white-50 small">#36b9cc</div>
  //           </div>
  //         </div>
  //       </div>
  //       <div class="col-lg-6 mb-4">
  //         <div class="card bg-warning text-white shadow">
  //           <div class="card-body">
  //             Warning
  //             <div class="text-white-50 small">#f6c23e</div>
  //           </div>
  //         </div>
  //       </div>
  //       <div class="col-lg-6 mb-4">
  //         <div class="card bg-danger text-white shadow">
  //           <div class="card-body">
  //             Danger
  //             <div class="text-white-50 small">#e74a3b</div>
  //           </div>
  //         </div>
  //       </div>
  //       <div class="col-lg-6 mb-4">
  //         <div class="card bg-secondary text-white shadow">
  //           <div class="card-body">
  //             Secondary
  //             <div class="text-white-50 small">#858796</div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>

  //   </div>

  //   <div class="col-lg-6 mb-4">

  //     <!-- Illustrations -->
  //     <div class="card shadow mb-4">
  //       <div class="card-header py-3">
  //         <h6 class="m-0 font-weight-bold text-primary">Illustrations</h6>
  //       </div>
  //       <div class="card-body">
  //         <div class="text-center">
  //           <img class="img-fluid px-3 px-sm-4 mt-3 mb-4" style="width: 25rem;" src="img/undraw_posting_photo.svg" alt="">
  //         </div>
  //         <p>Add some quality, svg illustrations to your project courtesy of <a target="_blank" rel="nofollow" href="https://undraw.co/">unDraw</a>, a constantly updated collection of beautiful svg images that you can use completely free and without attribution!</p>
  //         <a target="_blank" rel="nofollow" href="https://undraw.co/">Browse Illustrations on unDraw &rarr;</a>
  //       </div>
  //     </div>

  //     <!-- Approach -->
  //     <div class="card shadow mb-4">
  //       <div class="card-header py-3">
  //         <h6 class="m-0 font-weight-bold text-primary">Development Approach</h6>
  //       </div>
  //       <div class="card-body">
  //         <p>SB Admin 2 makes extensive use of Bootstrap 4 utility classes in order to reduce CSS bloat and poor page performance. Custom CSS classes are used to create custom components and custom utility classes.</p>
  //         <p class="mb-0">Before working with this theme, you should become familiar with the Bootstrap framework, especially the utility classes.</p>
  //       </div>
  //     </div>

  //   </div>
  // </div>`
}

// function generateSettingsHTML() {
//   return `
//   <div class="row">
//     <div class="col-xl-8 col-lg-7">
//         <div class="card shadow mb-4">
//           <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
//               <h6 class="m-0 font-weight-bold text-primary">Instellingen</h6>
//           </div>
//           <div class="card-body">
//           </div>
//         </div>
//     </div>

//   </div>`
// }
