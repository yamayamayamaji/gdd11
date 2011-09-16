function createAnswerSheet() {
	var response = UrlFetchApp.fetch('http://gdd-2011-quiz-japan.appspot.com/apps_script/data?param=-1268506788551340798');
	var cities = Utilities.jsonParse(response.getContentText());

	var ss = SpreadsheetApp.getActiveSpreadsheet();

	var city, city_data, data;
	var sheet, cell;
	for (var i = 0; i < cities.length; i++) {
		city = cities[i];
		city_data = city.data;

		if (i > 0) {
			sheet = ss.insertSheet(city.city_name);
		} else {
			sheet = ss.getActiveSheet().setName(city.city_name);
		}

		for (var j = 0; j < city_data.length; j++) {
			data = city_data[j];
			sheet.getRange('A' + (j + 1)).setValue(data.capacity);
			sheet.getRange('B' + (j + 1)).setValue(data.usage);
			sheet.getRange('C' + (j + 1)).setValue(Math.round(data.usage / data.capacity * 100 * 100) / 100 +'%');
		}
	}
}
