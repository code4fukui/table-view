import { create, createTable, createSelect, createButton } from "https://js.sabae.cc/stdcomp.js";
import { CSV } from "https://js.sabae.cc/CSV.js";
import { Day } from "https://js.sabae.cc/DateTime.js";
import { InputDate } from "https://code4fukui.github.io/input-datetime/input-date.js";

const isDay = (s) => {
  return s.match(/(\d\d\d\d-\d\d-\d\d)/) != null;
};

const getDateColumns = (data) => {
  if (data.length < 2) {
    return [];
  }
  const res = [];
  for (let i = 0; i < data[1].length; i++) {
    const d = data[1][i];
    //if (Day.isDay(d)) {
    if (isDay(d)) {
      res.push(data[0][i]);
    }
  }
  return res;
};

class TableView extends HTMLElement {
  constructor(data, opts) {
    super();
    this.init(data, opts);
  }
  async init(data, opts = {}) {
    if (opts) {
      for (const name in opts) {
        if (opts[name] != null) {
          this.setAttribute(name, opts[name]);
        }
      }
    }

    if (data == null) {
      data = await CSV.fetch(this.getAttribute("src"));
    }

    //const divf = create("div");
    if (opts.appendHeader) {
      this.appendChild(opts.appendHeader());
    }
    const days = getDateColumns(data);
    let dayselect, startday, endday;
    if (days.length > 0) {
      const div = create("div", this);
      div.className = "datefilter";
      dayselect = createSelect(days, div);
      startday = new InputDate();
      div.appendChild(startday);
      create("span", div).textContent = "〜";
      endday = new InputDate();
      div.appendChild(endday);
    }
    const filterDay = (data) => {
      if (dayselect == null) {
        return data;
      }
      const nparam = data[0].indexOf(dayselect.value);
      const sday = startday.value ? new Day(startday.value) : new Day(1, 1, 1);
      const eday = endday.value ? new Day(endday.value) : new Day(3000, 1, 1);
      return data.filter((d, idx) => {
        if (idx == 0) {
          return true;
        }
        try {
          return new Day(d[nparam]).includes(sday, eday));
        } catch (e) {
        }
        return false;
      };

    const inp = create("input", this);
    inp.placeholder = "キーワード";
    const btnfilter = create("button", this);
    btnfilter.textContent = "フィルタ";
    const btn = createButton("フィルタ解除", this);
    btn.style.marginLeft = ".5em";
    [inp, btn, btnfilter].forEach(d => {
      d.style.height = "2em";
      d.style.boxSizing = "border-box";
      //d.style.verticalAlign = "middle";
    });
    
    const divtbl = create("div", this, "table");
    
    const pagen = 100;
    let page = 0;
    let npage = Math.floor((data.length - 1) / pagen) + ((data.length - 1) % pagen == 0 ? 0 : 1);
    let showdata = null;

    const sorts = [];
    const flashSort = () => {
      const sort = sorts[0];
      if (!sort) {
        return;
      }
      const header = showdata.slice(0, 1);
      const nsort = header[0].findIndex(s => s == sort.key);
      const showdata2 = [];
      for (let i = 1; i < showdata.length; i++) {
        showdata2.push(showdata[i]); // .slice(1));
      }
      showdata2.sort((a, b) => {
        //const nlen = showdata.length;
        //console.log(sort.key);
        const n = a[nsort].localeCompare(b[nsort]);
        return sort.up ? n : -n;
      });
      showdata2.unshift(header[0]);
      showdata = showdata2;
    };
    const addSort = (sortkey, up) => {
      const s = sorts.find(s => s.key == sortkey);
      if (s) {
        const ns = sorts.indexOf(s);
        sorts.splice(ns, 1);
      }
      
      sorts.unshift({ key: sortkey, up });
      flashSort();
      show();
    };
    const show = (n = page) => {
      const data = showdata;
      if (n < 0) {
        n = 0;
      } else if (n >= npage) {
        n = npage - 1;
      }
      page = n;
      sel.value = "page " + (page + 1);
      const header = data.slice(0, 1)[0].map(h => {
        const div = create("div");
        const name = create("span", div);
        name.textContent = h;
        const btns = create("span", div, "sortbtn");
        const upbtn = create("span", btns);
        upbtn.textContent = "▲";
        const downbtn = create("span", btns);
        downbtn.textContent = "▼";
        upbtn.onclick = () => addSort(h, true);
        downbtn.onclick = () => addSort(h, false);
        return div;
      });
      const body = data.length > 1 ? data.slice(1 + n * pagen, 1 + (n + 1) * pagen) : [];
      divtbl.innerHTML = "";
      const body2 = body.map(b => {
        const b2 = [b[0]];
        // 最大表示文字列数設定
        const maxlen = 70;
        for (let i = 1; i < b.length; i++) {
          if (b[i].length > maxlen) {
            b2[i] = b[i].substring(0, maxlen) + "…";
          } else {
            b2[i] = b[i];
          }
        }

        // 列追加
        if (opts.appendColumn) {
          const header = data.slice(0, 1)[0];
          const csv = [header, b];
          const json = CSV.toJSON(csv)[0];
          const div = opts.appendColumn(json);
          b2.unshift(div);
        }
        return b2;
      });
      if (opts.appendColumn) {
        header.unshift(""); // [0] = "";
      }
      body2.unshift(header);
      createTable(body2, divtbl);
    };
    const showInit = (data2) => {
      showdata = data2;

      showdata = filterDay(data2);
      flashSort();
      npage = Math.floor((showdata.length - 1) / pagen) + ((showdata.length - 1) % pagen == 0 ? 0 : 1);
      page = 0;
      nview.value = "表示件数: " + (showdata.length - 1) + " / " + (data.length - 1);

      sel.innerHTML = "";
      for (let i = 1; i <= npage; i++) {
        create("option", sel).textContent = "page " + i;
      }
      show(0);
    };
    let sel = create("select");
    sel.onchange = () => show(parseInt(sel.value.split(" ")[1]) - 1);
    const div = create("div", this, "control");
    inp.onchange = () => {
      // todo: JISX0213 normalize
      const keys = inp.value.replace("　", " ").split(" ");
      const filtered = [data[0]];
      B: for (let i = 1; i < data.length; i++) {
        const d = data[i];
        for (const key of keys) {
          let flg = false;
          A: for (const v of d) {
            if (typeof v == "string") {
              if (v.indexOf(key) >= 0) {
                flg = true;
                break A;
              }
            }
          }
          if (!flg) {
            continue B;
          }
        }
        filtered.push(d);
      }
      showInit(filtered);
    };
    btn.onclick = () => {
      inp.value = "";
      showInit(data);
    };
    const nview = create("input", div);
    nview.disabled = true;
    [
      ["◀◀", () => show(0)],
      ["◀", () => show(page - 1)],
      ["sel"],
      ["▶", () => show(page + 1)],
      ["▶▶", () => show(npage - 1)]
    ].forEach(([label, func]) => {
      if (label == "sel") {
        div.appendChild(sel);
      } else {
        const span = create("span", div);
        span.textContent = label;
        span.onclick = func;
      }
    });
    showInit(data);

    if (dayselect) {
      const redraw = () => {
        showInit(data);
      };
      startday.onchange = redraw;
      endday.onchange = redraw;
      dayselect.onchange = redraw;
    }
    if (this.getAttribute("sortkey")) {
      //console.log(this.getAttribute("sortascending"));
      //console.log(this.getAttribute("sortascending2"));
      addSort(this.getAttribute("sortkey"), this.getAttribute("sortdesc") !== "");
    }
  }
}

customElements.define("table-view", TableView);

export { TableView } ;
