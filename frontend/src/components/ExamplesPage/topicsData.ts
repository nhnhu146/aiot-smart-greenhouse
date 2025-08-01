export const sensorTopicsData = [
	{
		name: "Temperature",
		topic: "greenhouse/sensors/temperature",
		dataType: "Float",
		unit: "°C",
		description: "Nhiệt độ môi trường từ cảm biến DHT11",
		examples: [
			{ description: "Nhiệt độ bình thường", value: 25.5 },
			{ description: "Nhiệt độ cao", value: 35.0 },
			{ description: "Nhiệt độ thấp", value: 15.2 }
		]
	},
	{
		name: "Humidity",
		topic: "greenhouse/sensors/humidity",
		dataType: "Float",
		unit: "%",
		description: "Độ ẩm không khí từ cảm biến DHT11",
		examples: [
			{ description: "Độ ẩm tối ưu", value: 65.0 },
			{ description: "Độ ẩm cao", value: 80.0 },
			{ description: "Độ ẩm thấp", value: 40.0 }
		]
	},
	{
		name: "Soil Moisture",
		topic: "greenhouse/sensors/soil",
		dataType: "Binary",
		unit: "0/1",
		description: "Trạng thái độ ẩm đất (0=khô, 1=ẩm)",
		examples: [
			{ description: "Đất khô", value: 0 },
			{ description: "Đất ẩm", value: 1 }
		]
	},
	{
		name: "Water Level",
		topic: "greenhouse/sensors/water",
		dataType: "Binary",
		unit: "0/1",
		description: "Mức nước trong bể (0=thấp, 1=đủ)",
		examples: [
			{ description: "Mức nước thấp", value: 0 },
			{ description: "Mức nước đủ", value: 1 }
		]
	},
	{
		name: "Light Level",
		topic: "greenhouse/sensors/light",
		dataType: "Binary",
		unit: "0/1",
		description: "Cường độ ánh sáng (0=tối, 1=sáng)",
		examples: [
			{ description: "Môi trường tối", value: 0 },
			{ description: "Có ánh sáng", value: 1 }
		]
	},
	{
		name: "Rain Status",
		topic: "greenhouse/sensors/rain",
		dataType: "Binary",
		unit: "0/1",
		description: "Trạng thái mưa (0=không mưa, 1=có mưa)",
		examples: [
			{ description: "Không mưa", value: 0 },
			{ description: "Có mưa", value: 1 }
		]
	},
	{
		name: "Plant Height",
		topic: "greenhouse/sensors/height",
		dataType: "Integer",
		unit: "cm",
		description: "Chiều cao cây trồng đo bằng cảm biến siêu âm",
		examples: [
			{ description: "Cây nhỏ", value: 15 },
			{ description: "Cây trung bình", value: 25 },
			{ description: "Cây lớn", value: 35 }
		]
	}
];

export const controlTopicsData = [
	{
		name: "Light Control",
		topic: "greenhouse/devices/light",
		dataType: "String",
		description: "Điều khiển đèn LED",
		examples: [
			{ description: "Bật đèn", value: "on" },
			{ description: "Tắt đèn", value: "off" }
		]
	},
	{
		name: "Pump Control",
		topic: "greenhouse/devices/pump",
		dataType: "String",
		description: "Điều khiển máy bơm nước",
		examples: [
			{ description: "Bật máy bơm", value: "on" },
			{ description: "Tắt máy bơm", value: "off" }
		]
	},
	{
		name: "Window Control",
		topic: "greenhouse/devices/window",
		dataType: "String",
		description: "Điều khiển cửa sổ tự động",
		examples: [
			{ description: "Mở cửa sổ", value: "open" },
			{ description: "Đóng cửa sổ", value: "close" }
		]
	},
	{
		name: "Door Control",
		topic: "greenhouse/devices/door",
		dataType: "String",
		description: "Điều khiển cửa ra vào",
		examples: [
			{ description: "Mở cửa", value: "open" },
			{ description: "Đóng cửa", value: "close" }
		]
	}
];
