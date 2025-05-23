if (window.location.href.includes('studentIndex.html')) {

  const createAnalyticsButton = () => {
    const btn = document.createElement('button');
    btn.id = 'attendance-analytics-btn';
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.left = '50%';
    btn.style.transform = 'translateX(-50%)';
    btn.style.zIndex = '9999';
    btn.style.backgroundColor = '#3b82f6';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '50px';
    btn.style.width = '180px';
    btn.style.height = '50px';
    btn.style.fontSize = '16px';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.transition = 'all 0.3s ease';
    btn.style.fontFamily = "'Poppins', sans-serif";
    btn.style.fontWeight = '500';
    btn.innerHTML = '📊 View Analytics';
    btn.title = 'Show Attendance Analytics';
    btn.setAttribute('aria-label', 'View Attendance Analytics');

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateX(-50%) scale(1.05)';
      btn.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.25)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateX(-50%) scale(1)';
      btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    });

    btn.addEventListener('mousedown', () => {
      btn.style.transform = 'translateX(-50%) scale(0.95)';
    });

    btn.addEventListener('mouseup', () => {
      btn.style.transform = 'translateX(-50%) scale(1.05)';
    });

    const pulseAnimation = `
      @keyframes pulse {
        0% { transform: translateX(-50%) scale(1); }
        50% { transform: translateX(-50%) scale(1.05); }
        100% { transform: translateX(-50%) scale(1); }
      }
      @keyframes blink {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.innerHTML = pulseAnimation;
    document.head.appendChild(styleElement);

    btn.style.animation = 'pulse 2s infinite ease-in-out';
    document.body.appendChild(btn);
    return btn;
  };

  const analyticsBtn = createAnalyticsButton();

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const observer = new MutationObserver(debounce(() => {
    try {
      const nameElement = document.querySelector('.x-form-display-field');
      const rollElement = document.querySelector('#profileUsn .x-form-display-field');
      const attendanceRows = document.querySelectorAll('.x-fieldset.bottom-border.x-fieldset-default');

      if (!nameElement || !rollElement || attendanceRows.length === 0) {
        console.log("Required elements not found yet:", {
          nameElement: !!nameElement,
          rollElement: !!rollElement,
          attendanceRows: attendanceRows.length
        });
        return;
      }

      observer.disconnect();

      const studentName = nameElement.textContent ? nameElement.textContent.trim() : "Name not found";
      const studentRollNumber = rollElement.textContent ? rollElement.textContent.trim() : "Roll number not found";

      let totalPresent = 0;
      let totalConducted = 0;
      let subjectDetails = [];

      attendanceRows.forEach((row, index) => {
        try {
          const fields = row.querySelectorAll('.x-form-display-field');
          if (fields.length < 2) {
            console.warn(`Row ${index} has insufficient fields, skipping`, fields);
            return;
          }

          let subjectName = "";
          let conducted = 0;
          let present = 0;
          fields.forEach((field, fieldIndex) => {
            const text = field.textContent.trim();
            const value = parseInt(text) || 0;
            if (fieldIndex === 0) subjectName = text;
            if (fieldIndex === 2) present = value;
            if (fieldIndex === 3) conducted = value;
            console.log(`Row ${index}, Field ${fieldIndex}: ${text} (Value: ${value})`);
          });

          if (conducted > 0 && present >= 0) {
            totalConducted += conducted;
            totalPresent += present;

            const percentage = (present / conducted * 100).toFixed(1);
            let recoveryNeeded = 0;
            let newConducted = conducted;
            let newPresent = present;
            let newPercentage = percentage;

            if (percentage < 75) {
              recoveryNeeded = Math.ceil((0.75 * conducted - present) / 0.25);
              newConducted = conducted + recoveryNeeded;
              newPresent = present + recoveryNeeded;
              newPercentage = (newPresent / newConducted * 100).toFixed(1);
            }

            subjectDetails.push({
              name: subjectName,
              present,
              conducted,
              percentage,
              status: percentage >= 75 ? 'OK' : 'Low',
              recoveryNeeded,
              newConducted,
              newPresent,
              newPercentage
            });
          } else {
            console.warn(`Row ${index} has invalid data: Conducted=${conducted}, Present=${present}`);
          }
        } catch (rowError) {
          console.warn(`Error processing row ${index}:`, rowError);
        }
      });

      if (totalConducted === 0) {
        console.warn("No valid attendance data found after processing rows");
        return;
      }

      const totalAbsent = totalConducted - totalPresent;
      const percentage = totalConducted > 0 ? ((totalPresent / totalConducted) * 100).toFixed(1) : 0;

      let feedback = '';
      let feedbackColor = '';
      let chartColor = '';
      if (percentage < 75) {
        feedback = 'Your attendance is below 75%. Please improve to avoid issues.';
        feedbackColor = '#dc2626';
        chartColor = '#dc2626';
      } else if (percentage >= 75 && percentage <= 80) {
        feedback = 'Your attendance is good, keep up the effort!';
        feedbackColor = '#2563eb';
        chartColor = '#2563eb';
      } else {
        feedback = 'Your attendance is outstanding, excellent work!';
        feedbackColor = '#16a34a';
        chartColor = '#16a34a';
      }

      const getAttendanceTrend = () => {
        if (subjectDetails.length < 2) return { text: 'N/A', color: '#eab308', icon: '🟡' };
        const mid = Math.floor(subjectDetails.length / 2);
        const firstHalfAvg = subjectDetails.slice(0, mid).reduce((sum, sub) => sum + parseFloat(sub.percentage), 0) / mid;
        const secondHalfAvg = subjectDetails.slice(mid).reduce((sum, sub) => sum + parseFloat(sub.percentage), 0) / (subjectDetails.length - mid);
        if (secondHalfAvg - firstHalfAvg > 5) return { text: 'Improving', color: '#16a34a', icon: '🟢' };
        if (firstHalfAvg - secondHalfAvg > 5) return { text: 'Declining', color: '#dc2626', icon: '🔴' };
        return { text: 'Stable', color: '#eab308', icon: '🟡' };
      };

      const trend = getAttendanceTrend();

      const exportToCSV = () => {
        const subjectRows = document.querySelectorAll('.x-fieldset.bottom-border.x-fieldset-default');
        const subjectCodes = Array.from(subjectRows).map(row => {
          const firstCell = row.querySelector('.x-form-display-field:first-child');
          return firstCell ? firstCell.textContent.trim() : 'N/A';
        });

        const csvRows = [
          ['Student Name', studentName],
          ['Roll Number', studentRollNumber],
          ['Total Percentage', `${percentage}%`],
          ['Total Classes', totalConducted],
          ['Classes Attended', totalPresent],
          ['Classes Absent', totalAbsent],
          [],
          ['Subject Code', 'Percentage', 'Classes Needed', 'Status']
        ];

        subjectDetails.forEach((subject, index) => {
          const subjectCode = subjectCodes[index] || `Sub-${index + 1}`;
          csvRows.push([
            subjectCode,
            `${subject.percentage}%`,
            subject.percentage >= 75 ? '-' : subject.recoveryNeeded,
            subject.status
          ]);
        });

        const csvContent = csvRows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance_${studentRollNumber}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      };

      const showSubjectDetails = () => {
        const existingTable = document.getElementById('subject-details-box');
        if (existingTable) {
          existingTable.style.animation = 'slideOut 0.4s ease-out';
          setTimeout(() => existingTable.remove(), 400);
          return;
        }

        const subjectRows = document.querySelectorAll('.x-fieldset.bottom-border.x-fieldset-default');
        const subjectCodes = Array.from(subjectRows).map(row => {
          const firstCell = row.querySelector('.x-form-display-field:first-child');
          return firstCell ? firstCell.textContent.trim() : 'N/A';
        });

        const tableBox = document.createElement('div');
        tableBox.id = 'subject-details-box';
        tableBox.style.position = 'fixed';
        tableBox.style.top = '50%';
        tableBox.style.left = '50%';
        tableBox.style.transform = 'translate(-50%, -50%)';
        tableBox.style.backgroundColor = 'var(--background-color)';
        tableBox.style.borderRadius = '16px';
        tableBox.style.padding = '20px';
        tableBox.style.zIndex = '10001';
        tableBox.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
        tableBox.style.maxWidth = '600px';
        tableBox.style.width = '90%';
        tableBox.style.maxHeight = '70vh';
        tableBox.style.overflowY = 'auto';
        tableBox.style.fontFamily = "'Poppins', sans-serif";
        tableBox.style.animation = 'slideIn 0.5s ease-out';
        tableBox.className = document.getElementById('attendance-info-box')?.classList.contains('dark-mode') ? 'dark-mode' : 'light-mode';
        tableBox.setAttribute('role', 'dialog');
        tableBox.setAttribute('aria-label', 'Subject-wise Attendance Details');

        const tableRows = subjectDetails.map((subject, index) => {
          const subjectCode = subjectCodes[index] || `Sub-${index + 1}`;
          const isCritical = parseFloat(subject.percentage) < 65;
          return `
            <tr style="border-bottom: 1px solid var(--separator-color);">
              <td style="padding: 10px; color: var(--text-color);">${subjectCode}${isCritical ? ' <span style="color: #dc2626;" title="Critical: Below 65%">&#9888;</span>' : ''}</td>
              <td style="padding: 10px; text-align: center; color: ${subject.percentage >= 75 ? '#16a34a' : '#dc2626'}; font-weight: 500;">${subject.percentage}%</td>
              <td style="padding: 10px; text-align: center; color: var(--text-color);">
                ${subject.percentage >= 75 ? '-' : subject.recoveryNeeded}
              </td>
              <td style="padding: 10px; text-align: center;">
                <span style="display: inline-block; padding: 4px 8px; border-radius: 12px; background: ${subject.percentage >= 75 ? '#16a34a20' : '#dc262620'}; color: ${subject.percentage >= 75 ? '#16a34a' : '#dc2626'}; font-size: 12px;">
                  ${subject.percentage >= 75 ? 'OK' : 'Low'}
                </span>
              </td>
            </tr>
          `;
        }).join('');

        tableBox.innerHTML = `
          <h3 style="margin: 0 0 20px 0; color: var(--strong-text-color);">Subject-wise Recovery Plan</h3>
          <table style="width: 100%; border-collapse: collapse;" role="grid">
            <thead>
              <tr style="border-bottom: 1px solid var(--separator-color);">
                <th style="padding: 10px; text-align: left; color: var(--strong-text-color);">Subject Code</th>
                <th style="padding: 10px; text-align: center; color: var(--strong-text-color);">%</th>
                <th style="padding: 10px; text-align: center; color: var(--strong-text-color);">Classes Needed</th>
                <th style="padding: 10px; text-align: center; color: var(--strong-text-color);">Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <button id="close-subject-details" style="background: #3b82f6; color: white; border: none; border-radius: 6px; padding: 8px 16px; font-size: 14px; margin-top: 20px; cursor: pointer; display: block; margin-left: auto; transition: all 0.3s ease;" aria-label="Close subject details">Close</button>
        `;

        document.body.appendChild(tableBox);

        const closeBtn = tableBox.querySelector('#close-subject-details');
        closeBtn.addEventListener('click', () => {
          tableBox.style.animation = 'slideOut 0.4s ease-out';
          setTimeout(() => tableBox.remove(), 400);
        });

        tableBox.addEventListener('mouseenter', () => {
          tableBox.style.transform = 'translate(-50%, -50%) scale(1.02)';
          tableBox.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.25)';
        });

        tableBox.addEventListener('mouseleave', () => {
          tableBox.style.transform = 'translate(-50%, -50%) scale(1)';
          tableBox.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
        });

        tableBox.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') closeBtn.click();
        });
      };

      const createDonutChart = (value, maxValue, color, size = 50) => {
        const circumference = 2 * Math.PI * (size / 2 - 5);
        const offset = circumference - (value / maxValue) * circumference;

        return `
          <div style="position: relative; width: ${size}px; height: ${size}px; margin: 0 auto;">
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg); transition: transform 1s ease;">
              <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 5}" fill="none" stroke="var(--chart-background)" stroke-width="5" />
              <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 5}" fill="none" stroke="${color}" stroke-width="5" 
                stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                style="transition: stroke-dashoffset 1s ease-out;" />
            </svg>
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
              font-weight: 600; color: ${color}; font-size: ${size/4}px;">
              ${value}
            </div>
          </div>
        `;
      };

      const createBarChart = () => {
        const labels = subjectDetails.map(sub => sub.name.substring(0, 8));
        const fullLabels = subjectDetails.map(sub => sub.name);
        const data = subjectDetails.map(sub => sub.percentage);
        const colors = subjectDetails.map(sub => sub.percentage >= 75 ? 'url(#greenGradient)' : 'url(#redGradient)');
        const critical = subjectDetails.map(sub => parseFloat(sub.percentage) < 65);

        const maxValue = 100;
        const barHeight = 150;
        const maxWidth = 410; // Card width (450px) - 2 * 20px padding
        const minBarWidth = 20;
        const minSpacing = 10;
        const totalBars = labels.length;
        const totalSpacing = (totalBars - 1) * minSpacing;
        const availableWidth = maxWidth - totalSpacing;
        const barWidth = Math.min(minBarWidth, availableWidth / totalBars);
        const totalChartWidth = totalBars * barWidth + totalSpacing;

        let bars = '';
        labels.forEach((label, i) => {
          const height = (data[i] / maxValue) * barHeight;
          const y = barHeight - height;
          const x = i * (barWidth + minSpacing);

          bars += `
            <g class="bar" style="animation: growIn 0.5s ease-out ${i * 0.1}s forwards; opacity: 0;">
              <title>${fullLabels[i]}: ${data[i]}%</title>
              <rect x="${x}" y="${y}" width="${barWidth}" height="${height}" fill="${colors[i]}" rx="4" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));" />
              <text x="${x + barWidth/2}" y="${barHeight + 20}" text-anchor="middle" fill="var(--text-color)" font-size="10" transform="rotate(-45 ${x + barWidth/2} ${barHeight + 20})">${label}${critical[i] ? '' : ''}</text>
              <text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" fill="var(--text-color)" font-size="10" font-weight="600">${data[i]}%</text>
            </g>
          `;
        });

        return `
          <div style="text-align: center; padding: 10px; overflow-x: auto;">
            <svg width="${totalChartWidth}" height="${barHeight + 40}" viewBox="0 0 ${totalChartWidth} ${barHeight + 40}">
              <defs>
                <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#16a34a;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
                </linearGradient>
                <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#b91c1c;stop-opacity:1" />
                </linearGradient>
              </defs>
              ${bars}
            </svg>
            <div style="margin-top: 10px; font-size: 12px; color: var(--text-color);">Subject-wise Attendance (%)</div>
          </div>
        `;
      };

      const createDonutChartGraph = () => {
        const data = [
          { label: 'Present', value: totalPresent, color: 'url(#greenGradient)' },
          { label: 'Absent', value: totalAbsent, color: 'url(#redGradient)' }
        ];

        const total = data.reduce((sum, item) => sum + item.value, 0);
        const center = 60;
        const outerRadius = 50;
        const innerRadius = 30;

        let cumulativePercent = 0;
        let paths = '';
        let legends = '';

        data.forEach((item, i) => {
          const percent = item.value / total;
          const startXOuter = center + outerRadius * Math.cos(2 * Math.PI * cumulativePercent);
          const startYOuter = center + outerRadius * Math.sin(2 * Math.PI * cumulativePercent);
          const startXInner = center + innerRadius * Math.cos(2 * Math.PI * cumulativePercent);
          const startYInner = center + innerRadius * Math.sin(2 * Math.PI * cumulativePercent);
          cumulativePercent += percent;
          const endXOuter = center + outerRadius * Math.cos(2 * Math.PI * cumulativePercent);
          const endYOuter = center + outerRadius * Math.sin(2 * Math.PI * cumulativePercent);
          const endXInner = center + innerRadius * Math.cos(2 * Math.PI * cumulativePercent);
          const endYInner = center + innerRadius * Math.sin(2 * Math.PI * cumulativePercent);

          const largeArcFlag = percent > 0.5 ? 1 : 0;

          paths += `
            <path d="M ${startXOuter} ${startYOuter} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endXOuter} ${endYOuter} 
                     L ${endXInner} ${endYInner} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startXInner} ${startYInner} Z" 
                  fill="${item.color}" style="animation: rotateIn 0.5s ease-out;" />
          `;

          const angle = (cumulativePercent - percent/2) * 2 * Math.PI;
          const textX = center + (outerRadius - 10) * Math.cos(angle);
          const textY = center + (outerRadius - 10) * Math.sin(angle);

          paths += `
            <text x="${textX}" y="${textY}" text-anchor="middle" fill="white" font-size="8" font-weight="600">
              ${Math.round(percent * 100)}%
            </text>
          `;

          legends += `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <div style="width: 12px; height: 12px; background: ${item.color.replace('url(#', '').replace('Gradient)', '')}; border-radius: 2px; margin-right: 8px;"></div>
              <span style="font-size: 12px; color: var(--text-color)">${item.label}: ${item.value}</span>
            </div>
          `;
        });

        return `
          <div style="display: flex; justify-content: center; align-items: center; gap: 20px; padding: 10px;">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#16a34a;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
                </linearGradient>
                <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#b91c1c;stop-opacity:1" />
                </linearGradient>
              </defs>
              ${paths}
            </svg>
            <div style="display: flex; flex-direction: column; justify-content: center;">
              ${legends}
            </div>
          </div>
          <div style="margin-top: 10px; font-size: 12px; color: var(--text-color); text-align: center;">Attendance Distribution</div>
        `;
      };

      const showAttendanceInfo = () => {
        const existingBox = document.getElementById('attendance-info-box');
        if (existingBox) {
          existingBox.style.animation = 'slideOut 0.4s ease-out';
          setTimeout(() => existingBox.remove(), 400);
          return;
        }

        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap';
        document.head.appendChild(fontLink);

        const savedTheme = localStorage.getItem('attendanceTheme') || 'dark-mode';
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
          @keyframes slideIn { 0% { transform: scale(0.95) translate(-50%, -50%); opacity: 0; } 100% { transform: scale(1) translate(-50%, -50%); opacity: 1; } }
          @keyframes slideOut { 0% { transform: scale(1) translate(-50%, -50%); opacity: 1; } 100% { transform: scale(0.95) translate(-50%, -50%); opacity: 0; } }
          @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); } 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes growIn { from { opacity: 0; transform: scaleY(0); } to { opacity: 1; transform: scaleY(1); } }
          @keyframes rotateIn { from { opacity: 0; transform: rotate(-90deg); } to { opacity: 1; transform: rotate(0deg); } }

          #attendance-info-box {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--background-color);
            border-radius: 16px;
            padding: 0;
            z-index: 10000;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            // max-width: 700px;
            max-height: 80vh;
             
            overflow-y: auto;
            font-family: 'Poppins', sans-serif;
            transition: all 0.4s ease;
            animation: slideIn 0.5s ease-out;
          }

          #attendance-info-box::-webkit-scrollbar {
            width: 6px;
          }

          #attendance-info-box::-webkit-scrollbar-track {
            background: var(--scrollbar-track);
            border-radius: 3px;
          }

          #attendance-info-box::-webkit-scrollbar-thumb {
            background: var(--scrollbar-thumb);
            border-radius: 3px;
          }

          #attendance-info-box header {
            background: linear-gradient(90deg, #1e3a8a, #3b82f6);
            color: var(--header-text-color);
            padding: 20px;
            border-radius: 16px 16px 0 0;
            position: sticky;
            top: 0;
            z-index: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          #attendance-info-box h3 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
          }

          #attendance-info-box .separator {
            height: 1px;
            background: var(--separator-color);
            margin: 12px 20px;
          }

          #attendance-info-box .info-row {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 12px 20px;
            font-size: 14px;
            color: var(--text-color);
          }

          #attendance-info-box .info-row strong {
            color: var(--strong-text-color);
            font-weight: 500;
          }

          #attendance-info-box .percentage-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          #attendance-info-box .main-donut {
            position: relative;
            width: 120px;
            height: 120px;
            margin-bottom: 8px;
          }

          #attendance-info-box .main-donut circle {
            cx: 60;
            cy: 60;
            r: 50;
            fill: none;
            stroke-width: 10;
          }

          #attendance-info-box .main-donut .background {
            stroke: var(--chart-background);
          }

          #attendance-info-box .main-donut .progress {
            stroke: ${chartColor};
            stroke-dasharray: 314;
            stroke-dashoffset: ${percentage ? 314 - (314 * percentage / 100) : 314};
            transition: stroke-dashoffset 1s ease-out;
          }

          #attendance-info-box .main-donut .percentage-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
            font-weight: 600;
            color: ${chartColor};
          }

          #attendance-info-box .cards {
            display: flex;
            justify-content: space-between;
            padding: 0 20px 20px;
            gap: 10px;
          }

          #attendance-info-box .card {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 15px 10px;
            flex: 1;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
            min-width: 0;
          }

          #attendance-info-box .card:hover {
            transform: translateY(-5px);
          }

          #attendance-info-box .card-title {
            margin: 0;
            font-size: 12px;
            color: var(--card-text-color);
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          #attendance-info-box .graph-container {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 15px;
            margin: 0 20px 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }

          #attendance-info-box .graph-nav {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-bottom: 15px;
          }

          #attendance-info-box .graph-btn {
            background: var(--button-bg);
            color: var(--button-text);
            border: none;
            border-radius: 20px;
            padding: 6px 12px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          #attendance-info-box .graph-btn.active {
            background: ${chartColor};
            color: white;
          }

          #attendance-info-box .graph-btn:hover {
            opacity: 0.9;
            transform: translateY(-2px);
          }

          #attendance-info-box .graph-content {
            overflow-x: auto;
            scrollbar-width: thin;
            scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
          }

          #attendance-info-box .graph-content::-webkit-scrollbar {
            height: 6px;
          }

          #attendance-info-box .graph-content::-webkit-scrollbar-track {
            background: var(--scrollbar-track);
            border-radius: 3px;
          }

          #attendance-info-box .graph-content::-webkit-scrollbar-thumb {
            background: var(--scrollbar-thumb);
            border-radius: 3px;
          }

          #attendance-info-box .feedback {
            padding: 15px 20px;
            text-align: center;
            font-size: 14px;
            color: ${feedbackColor};
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          #attendance-info-box footer {
            padding: 12px 20px;
            border-top: 1px solid var(--separator-color);
            text-align: center;
            font-size: 12px;
            color: var(--footer-text-color);
            position: relative;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          #attendance-info-box .close-btn {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            font-size: 16px;
            color: var(--header-text-color);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
          }

          #attendance-info-box .close-btn:hover {
            background: #ef4444;
            transform: scale(1.1);
          }

          #attendance-info-box .mode-toggle {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 12px;
            color: var(--header-text-color);
            cursor: pointer;
            transition: all 0.3s ease;
          }

          #attendance-info-box .mode-toggle:hover {
            background: rgba(255, 255, 255, 0.4);
          }

          #attendance-info-box .subject-btn {
            background: ${chartColor};
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            font-size: 13px;
            margin-top: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          #attendance-info-box .subject-btn:hover {
            opacity: 0.9;
            transform: translateY(-2px);
          }

          #attendance-info-box .export-btn {
            background: #10b981;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          #attendance-info-box .export-btn:hover {
            opacity: 0.9;
            transform: translateY(-2px);
          }

          .dark-mode {
            --background-color: #1f2937;
            --header-text-color: white;
            --text-color: #d1d5db;
            --strong-text-color: #f9fafb;
            --separator-color: #4b5563;
            --chart-background: #4b5563;
            --card-bg: linear-gradient(135deg, #374151, #4b5563);
            --card-text-color: #9ca3af;
            --card-value-color: #f9fafb;
            --footer-text-color: #9ca3af;
            --scrollbar-track: #374151;
            --scrollbar-thumb: #4b5563;
            --button-bg: #4b5563;
            --button-text: #d1d5db;
          }

          .light-mode {
            --background-color: #ffffff;
            --header-text-color: white;
            --text-color: #374151;
            --strong-text-color: #1f2937;
            --separator-color: #e5e7eb;
            --chart-background: #e5e7eb;
            --card-bg: linear-gradient(135deg, #f9fafb, #e0e7ff);
            --card-text-color: #6b7280;
            --card-value-color: #1f2937;
            --footer-text-color: #6b7280;
            --scrollbar-track: #e5e7eb;
            --scrollbar-thumb: #d1d5db;
            --button-bg: #e5e7eb;
            --button-text: #374151;
          }
        `;
        document.head.appendChild(styleSheet);

        const infoBox = document.createElement('div');
        infoBox.id = 'attendance-info-box';
        infoBox.className = savedTheme;
        infoBox.style.animation = percentage < 75 ? 'pulse 2s infinite' : 'none';
        infoBox.setAttribute('role', 'dialog');
        infoBox.setAttribute('aria-label', 'Attendance Summary');

        const header = document.createElement('header');
        header.innerHTML = `<h3>Attendance Summary</h3>`;

        const createAnimatedHeading = () => {
          const heading = document.createElement('div');
          heading.style.marginBottom = '12px';
          heading.style.color = 'var(--strong-text-color)';
          heading.style.fontSize = '18px';
          heading.style.textAlign = 'center';
          heading.style.marginTop = '24px';
          heading.style.position = 'relative';
          heading.style.animation = 'fadeIn 0.5s ease';
          heading.style.display = 'flex';
          heading.style.alignItems = 'center';
          heading.style.justifyContent = 'center';
          heading.style.gap = '12px';

          const fixedSpan = document.createElement('span');
          fixedSpan.textContent = 'Devolped by ';
          fixedSpan.style.animation = 'blink 1s infinite';
          heading.appendChild(fixedSpan);

          const animatedSpan = document.createElement('h4');
          heading.appendChild(animatedSpan);

          const fullText = 'Department of Data Science';
          let index = 0;

          function animateText() {
            if (index < fullText.length) {
              animatedSpan.textContent += fullText[index];
              index++;
              setTimeout(animateText, 150);
            }
          }

          animateText();
          return heading;
        };

        const heading = createAnimatedHeading();

        const modeToggle = document.createElement('button');
        modeToggle.className = 'mode-toggle';
        modeToggle.textContent = savedTheme === 'dark-mode' ? 'Light Mode' : 'Dark Mode';
        modeToggle.setAttribute('aria-label', 'Toggle theme');
        modeToggle.addEventListener('click', () => {
          infoBox.classList.toggle('dark-mode');
          infoBox.classList.toggle('light-mode');
          const newTheme = infoBox.classList.contains('dark-mode') ? 'dark-mode' : 'light-mode';
          modeToggle.textContent = newTheme === 'dark-mode' ? 'Light Mode' : 'Dark Mode';
          localStorage.setItem('attendanceTheme', newTheme);
        });

        const separator1 = document.createElement('div');
        separator1.className = 'separator';

        const infoRow = document.createElement('div');
        infoRow.className = 'info-row';
        infoRow.innerHTML = `
          <div class="details">
            <div><strong>Name:</strong> ${studentName}</div>
            <div><strong>Roll Number:</strong> ${studentRollNumber}</div>
            <div><strong>Trend:</strong> <span style="color: ${trend.color};">${trend.icon} ${trend.text}</span></div>
          </div>
        `;

        const separator2 = document.createElement('div');
        separator2.className = 'separator';

        const percentageSection = document.createElement('div');
        percentageSection.className = 'percentage-section';
        percentageSection.innerHTML = `
          <div class="main-donut">
            <svg width="120" height="120">
              <circle class="background" />
              <circle class="progress" />
            </svg>
            <div class="percentage-text">${percentage}%</div>
          </div>
          <div>
            <p style="margin: 0; font-size: 14px; color: var(--text-color); font-weight: 500;">Total Percentage</p>
          </div>
          <button class="subject-btn" aria-label="View subject-wise details">Subject-wise Details</button>
        `;

        const separator3 = document.createElement('div');
        separator3.className = 'separator';

        const cards = document.createElement('div');
        cards.className = 'cards';
        cards.innerHTML = `
          <div class="card">
            ${createDonutChart(totalConducted, totalConducted, '#3b82f6', 50)}
            <p class="card-title">Total Classes</p>
          </div>
          <div class="card">
            ${createDonutChart(totalPresent, totalConducted, '#10b981', 50)}
            <p class="card-title">Attended</p>
          </div>
          <div class="card">
            ${createDonutChart(totalAbsent, totalConducted, '#ef4444', 50)}
            <p class="card-title">Absent</p>
          </div>
        `;

        const graphContainer = document.createElement('div');
        graphContainer.className = 'graph-container';
        graphContainer.innerHTML = `
          <div class="graph-nav">
            <button class="graph-btn active" data-graph="bar" aria-label="Show bar chart">Bar Chart</button>
            <button class="graph-btn" data-graph="donut" aria-label="Show donut chart">Donut Chart</button>
          </div>
          <div class="graph-content" id="graph-content">${createBarChart()}</div>
        `;

        const separator4 = document.createElement('div');
        separator4.className = 'separator';

        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'feedback';
        feedbackDiv.innerHTML = `<span>${feedback}</span>`;

        const footer = document.createElement('footer');
        footer.innerHTML = `
          <span>Last updated: ${new Date().toLocaleString()}</span>
          <button class="export-btn" aria-label="Export attendance data as CSV">Export as CSV</button>
        `;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', 'Close attendance summary');
        closeBtn.addEventListener('click', () => {
          infoBox.style.animation = 'slideOut 0.4s ease-out';
          setTimeout(() => infoBox.remove(), 400);
        });

        header.appendChild(modeToggle);
        infoBox.appendChild(header);
        infoBox.appendChild(heading);
        infoBox.appendChild(separator1);
        infoBox.appendChild(infoRow);
        infoBox.appendChild(separator2);
        infoBox.appendChild(percentageSection);
        infoBox.appendChild(separator3);
        infoBox.appendChild(cards);
        infoBox.appendChild(graphContainer);
        infoBox.appendChild(separator4);
        infoBox.appendChild(feedbackDiv);
        infoBox.appendChild(footer);
        infoBox.appendChild(closeBtn);
        document.body.appendChild(infoBox);

        const subjectBtn = infoBox.querySelector('.subject-btn');
        subjectBtn.addEventListener('click', showSubjectDetails);

        const exportBtn = infoBox.querySelector('.export-btn');
        exportBtn.addEventListener('click', exportToCSV);

        const graphButtons = infoBox.querySelectorAll('.graph-btn');
        const graphContent = infoBox.querySelector('#graph-content');
        graphButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            graphButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const graphType = btn.dataset.graph;
            if (graphType === 'bar') {
              graphContent.innerHTML = createBarChart();
            } else if (graphType === 'donut') {
              graphContent.innerHTML = createDonutChartGraph();
            }
          });
        });

        infoBox.addEventListener('mouseenter', () => {
          infoBox.style.transform = 'scale(1.02) translate(-50%, -50%)';
          infoBox.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.15)';
        });

        infoBox.addEventListener('mouseleave', () => {
          infoBox.style.transform = 'scale(1) translate(-50%, -50%)';
          infoBox.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
        });

        infoBox.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') closeBtn.click();
        });
      };

      analyticsBtn.addEventListener('click', showAttendanceInfo);

    } catch (error) {
      console.error("Error in attendance tracker:", error);
      const errorBox = document.createElement('div');
      errorBox.id = 'attendance-error-box';
      errorBox.style.position = 'fixed';
      errorBox.style.top = '50%';
      errorBox.style.left = '50%';
      errorBox.style.transform = 'translate(-50%, -50%)';
      errorBox.style.background = '#fee2e2';
      errorBox.style.border = '1px solid #ef4444';
      errorBox.style.borderRadius = '8px';
      errorBox.style.padding = '16px';
      errorBox.style.zIndex = '10000';
      errorBox.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      errorBox.style.maxWidth = '300px';
      errorBox.style.fontFamily = "'Poppins', sans-serif";
      errorBox.setAttribute('role', 'alert');
      errorBox.innerHTML = `
        <div style="display: flex; align-items: flex-start;">
          <div style="margin-right: 8px; color: #b91c1c; font-size: 18px;">⚠️</div>
          <div>
            <h4 style="margin: 0 0 6px 0; color: #b91c1c; font-size: 14px;">Error Loading Attendance</h4>
            <p style="margin: 0; color: #7f1d1d; font-size: 13px;">Could not load attendance data. Please refresh the page.</p>
          </div>
        </div>
        <button id="error-close-button" style="position: absolute; top: 8px; right: 8px; background: none; border: none; color: #b91c1c; cursor: pointer; font-size: 16px;" aria-label="Close error message">×</button>
      `;
      document.body.appendChild(errorBox);
      document.getElementById('error-close-button').addEventListener('click', () => {
        errorBox.style.animation = 'slideOut 0.4s ease-out';
        setTimeout(() => errorBox.remove(), 400);
      });
      setTimeout(() => {
        if (document.body.contains(errorBox)) {
          errorBox.style.animation = 'slideOut 0.4s ease-out';
          setTimeout(() => errorBox.remove(), 400);
        }
      }, 5000);
    }
  }, 100));

  observer.observe(document.body, { childList: true, subtree: true });

  setTimeout(() => {
    observer.disconnect();
    console.log("Timeout: Required elements not found within 15 seconds.");
  }, 15000);
} else {
  console.log("This extension only works on the studentIndex.html page.");
}
