import requests
import os
import json

months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

my_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.190 Safari/537.36'
}

weather_list = []

for month in months:
    url = 'http://lishi.tianqi.com/beijing/2022' + month + '.html'

    response = requests.get(url, headers=my_headers)
    response.encoding = 'utf-8'
    html = response.text

    # 找到id为thrui的ul
    ul = html.split('<ul class="thrui">')[1].split('</ul>')[0]
    lis = ul.split('</li>')[0:]

    # li中的5个div
    for li in lis:
        try:
            date = li.split('<div class="th200">')[1].split('</div>')[0].split(' ')[0]
            max_temp = li.split('<div class="th140">')[1].split('</div>')[0].split('℃')[0]
            min_temp = li.split('<div class="th140">')[2].split('</div>')[0].split('℃')[0]
            
            # 写入json文件
            weather_list.append({'date': date, 'max_temp': max_temp, 'min_temp': min_temp}).append(',')

        except:
            pass

# 写入json文件
with open('beijing_weather.json', 'a', encoding='utf-8') as f:
    f.write(json.dumps(weather_list, ensure_ascii=False, indent=4))
